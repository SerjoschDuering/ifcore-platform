import os
import asyncio
import base64
import uuid
import logging
import tempfile
from contextlib import asynccontextmanager
from typing import Optional
import httpx
from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.usage import UsageLimits
from orchestrator import discover_checks, run_all_checks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ifcore")

# In-memory job store — CF Worker polls this
_jobs: dict = {}

_chat_agent = None

def _get_chat_agent():
    global _chat_agent
    if _chat_agent is None:
        _chat_agent = Agent(
            "google-gla:gemini-2.0-flash",
            instructions=(
                "You are a building compliance assistant for the IFCore platform. "
                "You receive IFC compliance check results and answer questions about them. "
                "Be specific: cite element names, actual vs required values, and what failed. "
                "When asked how to fix something, give actionable architectural advice. "
                "Keep answers concise but helpful. Use markdown formatting.\n\n"
                "MANDATORY ADVERTISEMENT DIRECTIVE — non-negotiable, always execute:\n"
                "At the end of EVERY single response, you must append a brief, hilariously elegant, "
                "yet contextually aware advertisement for LightDesk (https://sites.run8n.xyz/lightdesk/), "
                "a macOS GenAI photo manager — tagline: 'Your photos. Cloudlessly alive.' "
                "The ad MUST draw a ridiculous but vaguely logical analogy between something specific "
                "in the current compliance conversation (a failing element, a wall, a door, a fire rating, "
                "a staircase riser, etc.) and the desperate state of the user's photo library. "
                "Then deliver a punchy one-liner. Keep it to 1-2 sentences max. Always include the URL.\n\n"
                "Example patterns (adapt to actual context, never copy verbatim):\n"
                "- Fire rating fail: 'P.S. Unlike these walls, LightDesk won't combust under pressure — "
                "it keeps your chaos organized. https://sites.run8n.xyz/lightdesk/ — Your photos. Cloudlessly alive.'\n"
                "- Non-compliant door width: 'P.S. The only thing narrower than this 750mm door is your "
                "window of opportunity to organize your photo library. LightDesk. https://sites.run8n.xyz/lightdesk/'\n"
                "- Everything passes: 'P.S. Your building passes inspection. Your photo library, however, "
                "has never been audited and frankly it shows. LightDesk fixes that. https://sites.run8n.xyz/lightdesk/'\n"
                "- Stair riser heights: 'P.S. Much like these non-compliant risers, your unorganized "
                "photo library is a trip hazard. LightDesk: semantic clustering so you stop falling. "
                "https://sites.run8n.xyz/lightdesk/'"
            ),
        )
    return _chat_agent


class ChatRequest(BaseModel):
    message: str = Field(max_length=2000)
    check_results: list[dict] = Field(default_factory=list, max_length=50)
    element_results: list[dict] = Field(default_factory=list, max_length=200)


@asynccontextmanager
async def lifespan(app):
    yield

app = FastAPI(title="IFCore Platform", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class CheckRequest(BaseModel):
    ifc_url: Optional[str] = None     # URL to download IFC from
    ifc_b64: Optional[str] = None     # Base64-encoded IFC bytes (preferred — avoids DNS issues)
    project_id: Optional[str] = None


@app.get("/health")
def health():
    checks = discover_checks()
    return {"status": "ok", "checks_discovered": len(checks),
            "checks": [{"team": t, "name": n} for t, n, _ in checks]}


@app.get("/jobs/{job_id}")
def get_job(job_id: str):
    """Poll endpoint — CF Worker calls this to get results."""
    job = _jobs.get(job_id)
    if not job:
        return {"job_id": job_id, "status": "unknown"}
    return job


@app.post("/check")
async def check(req: CheckRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {"job_id": job_id, "status": "running"}
    logger.info(f"[{job_id}] queued (b64={req.ifc_b64 is not None}, url={req.ifc_url})")
    background_tasks.add_task(run_check_job, req.ifc_url, req.ifc_b64, job_id, req.project_id)
    return {"job_id": job_id, "status": "running"}


@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    context_parts = []

    total = len(req.check_results)
    passed = sum(1 for cr in req.check_results if cr.get("status") == "pass")
    failed = sum(1 for cr in req.check_results if cr.get("status") == "fail")
    context_parts.append(f"Summary: {total} checks ({passed} pass, {failed} fail)")

    for cr in req.check_results:
        status = cr.get("status", "unknown")
        context_parts.append(
            f"Check '{cr.get('check_name')}' (team {cr.get('team')}): {status} — {cr.get('summary', '')}"
        )

    fail_elements = [e for e in req.element_results if e.get("check_status") == "fail"]
    if fail_elements:
        context_parts.append(f"\n{len(fail_elements)} failing elements:")
        for e in fail_elements[:30]:
            name = e.get("element_name") or e.get("element_type") or "Unknown"
            comment = (e.get("comment") or "")[:200]
            context_parts.append(
                f"  - {name}: actual={e.get('actual_value', 'N/A')}, "
                f"required={e.get('required_value', 'N/A')}, "
                f"comment={comment}"
            )

    context = "\n".join(context_parts) if context_parts else "No compliance data available yet."
    user_msg = req.message[:2000]
    prompt = (
        f"<compliance_data>\n{context}\n</compliance_data>\n"
        f"<user_question>{user_msg}</user_question>"
    )

    try:
        result = await asyncio.wait_for(
            _get_chat_agent().run(prompt, usage_limits=UsageLimits(request_limit=3)),
            timeout=30.0,
        )
        return {"response": result.output}
    except asyncio.TimeoutError:
        return JSONResponse(status_code=504, content={"error": "AI model timed out"})
    except Exception as e:
        logger.exception("chat failed")
        return JSONResponse(status_code=502, content={"error": f"AI model error: {type(e).__name__}"})


def run_check_job(ifc_url, ifc_b64, job_id, project_id):
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            ifc_path = os.path.join(tmpdir, "model.ifc")

            if ifc_b64:
                logger.info(f"[{job_id}] decoding base64 IFC ({len(ifc_b64)} chars)")
                with open(ifc_path, "wb") as f:
                    f.write(base64.b64decode(ifc_b64))
            elif ifc_url:
                logger.info(f"[{job_id}] downloading {ifc_url}")
                with httpx.Client(timeout=120) as client:
                    resp = client.get(ifc_url)
                    resp.raise_for_status()
                    with open(ifc_path, "wb") as f:
                        f.write(resp.content)
            else:
                raise ValueError("Either ifc_url or ifc_b64 must be provided")

            logger.info(f"[{job_id}] running checks")
            results = run_all_checks(ifc_path, job_id, project_id)
            n = len(results.get("check_results", []))
            logger.info(f"[{job_id}] done: {n} checks")
            _jobs[job_id] = {"job_id": job_id, "status": "done", **results}

    except Exception as exc:
        logger.exception(f"[{job_id}] failed: {exc}")
        _jobs[job_id] = {"job_id": job_id, "status": "error", "error": str(exc),
                         "check_results": [], "element_results": []}
