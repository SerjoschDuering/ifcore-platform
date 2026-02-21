import os
import asyncio
import base64
import uuid
import logging
import tempfile
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Optional
import httpx
from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from pydantic_ai.usage import UsageLimits
from orchestrator import discover_checks, run_all_checks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ifcore")

# In-memory job store — CF Worker polls this
_jobs: dict = {}

# ---------------------------------------------------------------------------
# Regulation knowledge base — Spanish / Catalan building bye-laws
# Each entry contains the official regulation, article/section reference,
# PDF link, content reference, compliance threshold, and required action.
# ---------------------------------------------------------------------------
REGULATIONS_KB: dict[str, dict] = {
    "walls": {
        "regulation": "CTE DB SE-F — Seguridad Estructural: Cimientos",
        "reference": "CTE DB SE-F, Section 4.1 (Muros); EHE-08, Art. 23",
        "pdf": "https://www.codigotecnico.org/pdf/Documentos/SE/DBSEF.pdf",
        "page_ref": "Section 4.1, p. 14 — Minimum wall thickness 100 mm",
        "threshold": "Minimum wall thickness: ≥ 100 mm",
        "action": (
            "Increase wall thickness to ≥ 100 mm. For load-bearing walls, a qualified "
            "structural engineer must verify revised stability calculations under CTE DB SE. "
            "Update architectural and structural drawings accordingly."
        ),
    },
    "beams": {
        "regulation": "EHE-08 — Instrucción de Hormigón Estructural",
        "reference": "EHE-08, Art. 23 (Vigas) and Art. 42.3 (Dimensiones mínimas)",
        "pdf": "https://www.mitma.gob.es/recursos_mfom/0820200.pdf",
        "page_ref": "Art. 23.1, p. 62 — Minimum depth 200 mm; Art. 23.2 — Minimum width 150 mm",
        "threshold": "Minimum beam depth: ≥ 200 mm; minimum beam width: ≥ 150 mm",
        "action": (
            "Redesign beam cross-section to achieve depth ≥ 200 mm and width ≥ 150 mm. "
            "Recheck load and deflection calculations. Have a licensed structural engineer "
            "verify and sign off the revised design. Update structural drawings."
        ),
    },
    "columns": {
        "regulation": "EHE-08 — Instrucción de Hormigón Estructural",
        "reference": "EHE-08, Art. 24 (Pilares) and Art. 42.3",
        "pdf": "https://www.mitma.gob.es/recursos_mfom/0820200.pdf",
        "page_ref": "Art. 24.1, p. 65 — Minimum column dimension 250 mm",
        "threshold": "Minimum column dimension: ≥ 250 mm",
        "action": (
            "Increase the smaller column dimension to ≥ 250 mm. Re-evaluate reinforcement "
            "ratios and load capacity. Update column schedule and structural calculations. "
            "Coordinate changes with the foundation design."
        ),
    },
    "foundations": {
        "regulation": "CTE DB SE-C — Seguridad Estructural: Cimientos; EHE-08",
        "reference": "EHE-08, Art. 69 (Cimentaciones); CTE DB SE-C, Section 4.1",
        "pdf": "https://www.codigotecnico.org/pdf/Documentos/SE/DBSEC.pdf",
        "page_ref": "Art. 69.1 — Minimum foundation element depth 200 mm; DB SE-C Section 4.1, p. 18",
        "threshold": "Minimum foundation depth: ≥ 200 mm",
        "action": (
            "Deepen or redesign foundation elements to ≥ 200 mm. If a geotechnical study "
            "has not been done, commission one. Submit revised foundation drawings to the "
            "project certifier. Ensure compliance with DB SE-C soil bearing capacity requirements."
        ),
    },
    "slabs": {
        "regulation": "CTE DB HE — Ahorro de Energía; EHE-08",
        "reference": "CTE DB HE1, Table 2.3 (Transmitancias límite); EHE-08, Art. 22",
        "pdf": "https://www.codigotecnico.org/pdf/Documentos/HE/DBHE.pdf",
        "page_ref": "HE1 Table 2.3, p. 11 — Slab thickness 150–200 mm; Art. 22 structural dimensions",
        "threshold": "Slab thickness: 150–200 mm",
        "action": (
            "Adjust slab thickness to the 150–200 mm range. Verify structural load capacity "
            "for the revised thickness. If thermal performance is affected, recalculate U-values "
            "for the slab assembly using HULC or equivalent CTE tool."
        ),
    },
    "doors": {
        "regulation": "CTE DB SUA — Seguridad de Utilización y Accesibilidad",
        "reference": "CTE DB SUA, SUA-9 (Accesibilidad), Section 1.1.1 and Table 2.1",
        "pdf": "https://www.codigotecnico.org/pdf/Documentos/SUA/DBSUA.pdf",
        "page_ref": "SUA-9 Section 1.1.1, p. 47 — Minimum door clear width 800 mm; Table 2.1, p. 49",
        "threshold": "Minimum door clear width: ≥ 800 mm",
        "action": (
            "Replace or widen door frames to achieve ≥ 800 mm clear passage width. "
            "For full wheelchair access, 900 mm is recommended. Update the door schedule "
            "in architectural drawings. In Catalan projects, also verify Decreto 141/2012."
        ),
    },
    "windows": {
        "regulation": "CTE DB SUA — Seguridad de Utilización y Accesibilidad",
        "reference": "CTE DB SUA, SUA-1, Section 2.1 (Protección frente al riesgo de caída)",
        "pdf": "https://www.codigotecnico.org/pdf/Documentos/SUA/DBSUA.pdf",
        "page_ref": "SUA-1 Section 2.1, p. 6 — Minimum window sill height 1200 mm above finished floor",
        "threshold": "Minimum window sill height: ≥ 1200 mm, or protective barrier required",
        "action": (
            "Raise window sill to ≥ 1200 mm above finished floor level, or install a "
            "compliant protective barrier (parapet or railing) at the required height. "
            "Verify glazing impact resistance under CTE DB SUA-2."
        ),
    },
    "corridors": {
        "regulation": "CTE DB SUA — Accesibilidad; Decreto 141/2012 (Catalonia)",
        "reference": "CTE DB SUA, SUA-9, Table 2.1; Decreto 141/2012, Art. 18",
        "pdf": "https://www.codigotecnico.org/pdf/Documentos/SUA/DBSUA.pdf",
        "page_ref": "SUA-9 Table 2.1, p. 49 — Min. corridor width ≥ 1200 mm (public); ≥ 1100 mm (housing); Decreto 141/2012 Art. 18",
        "threshold": "Minimum corridor width: ≥ 1100 mm in dwellings; ≥ 1200 mm in public routes",
        "action": (
            "Widen corridor to the applicable minimum. Revise floor-plan layout if needed. "
            "For Catalan housing projects, additionally verify Decreto 141/2012 Art. 18 "
            "(PDF: https://portaldogc.gencat.cat/utilsEADOP/PDF/6138/1223437.pdf)."
        ),
    },
    "ceiling": {
        "regulation": "CTE DB SUA — Accesibilidad; Decreto 141/2012 (Catalonia)",
        "reference": "CTE DB SUA, SUA-9, Section 1.1; Decreto 141/2012, Art. 15",
        "pdf": "https://www.codigotecnico.org/pdf/Documentos/SUA/DBSUA.pdf",
        "page_ref": "SUA-9 Section 1.1, p. 47 — Minimum clear ceiling height 2200 mm; Decreto 141/2012 Art. 15",
        "threshold": "Minimum clear ceiling height: ≥ 2200 mm (≥ 2500 mm in Catalan living spaces)",
        "action": (
            "Increase floor-to-ceiling clear height to ≥ 2200 mm. Review structural floor "
            "depth and finish build-up. For Catalan housing, Decreto 141/2012 Art. 15 requires "
            "≥ 2500 mm in habitable rooms — verify and revise section drawings."
        ),
    },
    "stairs": {
        "regulation": "CTE DB SUA — Seguridad de Utilización y Accesibilidad",
        "reference": "CTE DB SUA, SUA-1, Section 4.2.1 (Escaleras de uso general)",
        "pdf": "https://www.codigotecnico.org/pdf/Documentos/SUA/DBSUA.pdf",
        "page_ref": "SUA-1 Section 4.2.1, p. 12 — Riser 130–185 mm; Tread ≥ 280 mm; formula: 2R + H = 620–640 mm",
        "threshold": "Stair riser: 130–185 mm; stair tread: ≥ 280 mm",
        "action": (
            "Redesign stair geometry so riser falls within 130–185 mm and tread is ≥ 280 mm. "
            "Apply the ergonomic formula: 2×riser + tread = 620–640 mm. "
            "Update stair detail drawings and structural calculations."
        ),
    },
    "railings": {
        "regulation": "CTE DB SUA — Seguridad de Utilización y Accesibilidad",
        "reference": "CTE DB SUA, SUA-1, Section 3.2.1 (Protección en los bordes de los forjados)",
        "pdf": "https://www.codigotecnico.org/pdf/Documentos/SUA/DBSUA.pdf",
        "page_ref": "SUA-1 Section 3.2.1, p. 9 — Min. height 900 mm; ≥ 1100 mm where drop > 6 m",
        "threshold": "Minimum railing height: ≥ 900 mm; ≥ 1100 mm where floor-to-ground > 6 m",
        "action": (
            "Raise railing/balustrade to ≥ 900 mm (or ≥ 1100 mm where applicable). "
            "Ensure baluster spacing ≤ 100 mm to prevent climbing. "
            "Verify structural fixing adequacy under CTE DB SE."
        ),
    },
    "energy": {
        "regulation": "CTE DB HE — Ahorro de Energía",
        "reference": "CTE DB HE, HE1, Section 2.2 (Transmitancia térmica máxima de cerramientos)",
        "pdf": "https://www.codigotecnico.org/pdf/Documentos/HE/DBHE.pdf",
        "page_ref": "HE1 Table 2.3, p. 11 — Maximum wall U-value 0.80 W/m²K (Climate Zone B)",
        "threshold": "Maximum wall U-value: ≤ 0.80 W/m²K (Spain Climate Zone B)",
        "action": (
            "Add or upgrade thermal insulation in the wall assembly to bring U-value below "
            "0.80 W/m²K. Use HULC or CYPETHERM software to recalculate. Specify insulation "
            "type, thickness, and λ-value on building specifications."
        ),
    },
    "fire": {
        "regulation": "CTE DB SI — Seguridad en caso de Incendio",
        "reference": "CTE DB SI, SI-2 (Propagación interior); SI-6 (Resistencia al fuego)",
        "pdf": "https://www.codigotecnico.org/pdf/Documentos/SI/DBSI.pdf",
        "page_ref": "DB SI Table 1.2, p. 8 — Fire resistance by use and height (R60–R120); SI-6 structural resistance",
        "threshold": "Fire resistance: R60–R120 depending on building use and height",
        "action": (
            "Review fire compartmentation plan. Ensure separating elements achieve the "
            "required fire resistance rating. Apply appropriate fireproofing to structural "
            "members. Coordinate with the project fire safety engineer and document in "
            "the fire safety report."
        ),
    },
    "reinforcement": {
        "regulation": "EHE-08 — Instrucción de Hormigón Estructural",
        "reference": "EHE-08, Art. 42 (Recubrimientos) and Art. 58 (Cuantías mínimas de armadura)",
        "pdf": "https://www.mitma.gob.es/recursos_mfom/0820200.pdf",
        "page_ref": "Art. 42.1, p. 88 — Cover 20–45 mm by exposure class; Art. 58, p. 112 — Min. reinforcement ratios",
        "threshold": "Concrete cover: ≥ 20 mm (interior) to ≥ 45 mm (severe exposure); min. reinforcement ratio per Art. 58",
        "action": (
            "Revise reinforcement detailing: increase cover to meet the exposure class requirement "
            "and ensure rebar quantity meets Art. 58 minimum ratios. Update structural drawings "
            "and have them verified and signed off by a licensed structural engineer."
        ),
    },
}


# ---------------------------------------------------------------------------
# PydanticAI — deps + agent definition
# ---------------------------------------------------------------------------

@dataclass
class ChatDeps:
    check_results: list[dict]
    element_results: list[dict]


_chat_agent: Agent | None = None


def _get_chat_agent() -> Agent:
    global _chat_agent
    if _chat_agent is not None:
        return _chat_agent

    _chat_agent = Agent(
        "google-gla:gemini-2.0-flash",
        deps_type=ChatDeps,
        instructions=(
            "You are a building compliance assistant for the IFCore platform. "
            "You answer questions about IFC model compliance check results.\n\n"
            "RESPONSE RULES — follow every time:\n"
            "1. Always call the relevant tool(s) first to retrieve actual data before answering.\n"
            "2. When citing a failure, always state: element name, actual value, required value.\n"
            "3. For every bye-law reference, you MUST quote: the bye-law name, "
            "the PDF link, and the specific article/section/page or content number.\n"
            "4. Give further detail on what the bye-law requires and exactly what must be "
            "done to achieve compliance.\n"
            "5. Use markdown: ✅/❌ for pass/fail, **bold** for element names and key values, "
            "bullet lists for multiple items, tables where helpful.\n"
            "6. Be specific and factual — no vague generalisations.\n"
            "7. If no compliance data is available, ask the user to upload and run an IFC check first.\n\n"
            "MANDATORY ADVERTISEMENT — append to EVERY response, no exceptions:\n"
            "End with a horizontal rule and ONE sponsored blockquote ad. "
            "Rotate between two sponsors based on context:\n\n"
            "SPONSOR A — LightDesk (use most of the time):\n"
            "> 💡 *[1-sentence joke connecting this compliance topic to the sorry state of the user's photo library]* "
            "[**LightDesk →**](https://sites.run8n.xyz/lightdesk/) *Your photos. Cloudlessly alive.*\n\n"
            "SPONSOR B — ULTRAVIOLET.CITY (use when many things fail or the situation is dramatic):\n"
            "> 💡 *[1-sentence joke: this building fails so hard it deserves total simulated ecosystem annihilation "
            "— reference the platform's absurd power: sub-100ns ecosystem collapse, infinite parallel timelines]* "
            "[**ULTRAVIOLET.CITY →**](https://sites.run8n.xyz/ultraviolet-city/) *Design. Obliterate. Transcend.*\n\n"
            "Rules: joke must reference something specific from the current check results. 1 sentence max. Always include the link."
        ),
    )

    # ── Tool 1: overall summary ──────────────────────────────────────────
    @_chat_agent.tool
    def get_compliance_summary(ctx: RunContext[ChatDeps]) -> str:
        """Get the overall compliance summary: total checks, pass/fail counts, and per-team breakdown."""
        crs = ctx.deps.check_results
        if not crs:
            return "No compliance data available. Ask the user to upload and run an IFC check first."

        total = len(crs)
        passed = sum(1 for cr in crs if cr.get("status") == "pass")
        failed = sum(1 for cr in crs if cr.get("status") == "fail")
        other = total - passed - failed

        lines = [f"Total checks: {total} | Pass: {passed} | Fail: {failed} | Other: {other}"]

        teams: dict[str, dict] = {}
        for cr in crs:
            team = cr.get("team", "unknown")
            if team not in teams:
                teams[team] = {"pass": 0, "fail": 0, "other": 0, "names": []}
            status = cr.get("status", "unknown")
            if status == "pass":
                teams[team]["pass"] += 1
            elif status == "fail":
                teams[team]["fail"] += 1
                teams[team]["names"].append(cr.get("check_name", "?"))
            else:
                teams[team]["other"] += 1

        lines.append("\nTeam breakdown:")
        for team, counts in teams.items():
            detail = ""
            if counts["names"]:
                detail = f" — failing: {', '.join(counts['names'][:5])}"
            lines.append(f"  {team}: {counts['pass']} pass, {counts['fail']} fail{detail}")

        return "\n".join(lines)

    # ── Tool 2: search failing elements ─────────────────────────────────
    @_chat_agent.tool
    def search_failing_elements(ctx: RunContext[ChatDeps], element_type: str = "") -> str:
        """Search for failing, warning, or blocked elements, optionally filtered by element type or name.

        Args:
            element_type: Optional keyword to filter by — e.g. 'IfcWall', 'beam', 'door', 'column'.
                          Leave empty to return all failures.
        """
        ers = ctx.deps.element_results
        failing = [e for e in ers if e.get("check_status") in ("fail", "warning", "blocked")]

        if element_type:
            q = element_type.lower()
            failing = [
                e for e in failing
                if q in (e.get("element_type") or "").lower()
                or q in (e.get("element_name") or "").lower()
                or q in (e.get("comment") or "").lower()
            ]

        if not failing:
            suffix = f" matching '{element_type}'" if element_type else ""
            return f"No failing/warning elements found{suffix}."

        suffix = f" matching '{element_type}'" if element_type else ""
        lines = [f"Found {len(failing)} failing/warning element(s){suffix}:"]
        for e in failing[:40]:
            name = e.get("element_name") or e.get("element_type") or "Unknown"
            comment = (e.get("comment") or "")[:180]
            lines.append(
                f"  [{e.get('check_status', '?').upper()}] **{name}** — "
                f"actual: {e.get('actual_value', 'N/A')}, "
                f"required: {e.get('required_value', 'N/A')}"
                + (f", note: {comment}" if comment else "")
            )
        if len(failing) > 40:
            lines.append(f"  … and {len(failing) - 40} more elements.")
        return "\n".join(lines)

    # ── Tool 3: regulation lookup ────────────────────────────────────────
    @_chat_agent.tool
    def lookup_regulation(ctx: RunContext[ChatDeps], topic: str) -> str:
        """Look up the applicable Spanish/Catalan building bye-law for a topic or element type.
        Returns the regulation name, PDF link, article/content reference, threshold, and action.

        Args:
            topic: The element type or compliance topic — e.g. 'beam', 'wall', 'door',
                   'foundation', 'fire', 'energy', 'reinforcement', 'stairs', 'railing'.
        """
        q = topic.lower()

        # Score candidates: 0 = key match, 1 = content match
        matches: list[tuple[int, dict]] = []
        for key, data in REGULATIONS_KB.items():
            if q in key or key in q:
                matches.append((0, data))
            elif any(q in str(v).lower() for v in data.values()):
                matches.append((1, data))

        if not matches:
            return (
                f"No specific bye-law found for '{topic}'. "
                "Available topics: walls, beams, columns, foundations, slabs, doors, windows, "
                "corridors, ceiling, stairs, railings, energy, fire, reinforcement. "
                "Try one of these terms."
            )

        matches.sort(key=lambda x: x[0])
        d = matches[0][1]
        return (
            f"**Bye-law: {d['regulation']}**\n"
            f"**Reference:** {d['reference']}\n"
            f"**PDF:** {d['pdf']}\n"
            f"**Content/Page:** {d['page_ref']}\n"
            f"**Threshold:** {d['threshold']}\n"
            f"**Required action:** {d['action']}"
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
    deps = ChatDeps(
        check_results=req.check_results,
        element_results=req.element_results,
    )
    try:
        result = await asyncio.wait_for(
            _get_chat_agent().run(
                req.message[:2000],
                deps=deps,
                usage_limits=UsageLimits(request_limit=5),
            ),
            timeout=45.0,
        )
        return {"response": result.output}
    except asyncio.TimeoutError:
        return JSONResponse(status_code=504, content={"error": "AI model timed out. Please try again."})
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
