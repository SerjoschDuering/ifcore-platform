import os
import base64
import uuid
import logging
import tempfile
from contextlib import asynccontextmanager
from typing import Optional
import httpx
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from orchestrator import discover_checks, run_all_checks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ifcore")

# In-memory job store — CF Worker polls this
_jobs: dict = {}


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
