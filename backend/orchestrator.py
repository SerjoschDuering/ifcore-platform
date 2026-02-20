import importlib.util
import os
import glob
import uuid
import time
import ifcopenshell

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TEAM_FIELDS = [
    "element_id", "element_type", "element_name", "element_name_long",
    "check_status", "actual_value", "required_value", "comment", "log",
]


def discover_checks():
    checks = []
    pattern = os.path.join(BASE_DIR, "teams", "*", "tools", "checker_*.py")
    for path in sorted(glob.glob(pattern)):
        parts = path.replace(BASE_DIR + os.sep, "").split(os.sep)
        team = parts[1]
        module_name = os.path.splitext(os.path.basename(path))[0]
        try:
            spec = importlib.util.spec_from_file_location(f"teams.{team}.{module_name}", path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
        except Exception as exc:
            print(f"[orchestrator] SKIP {team}/{module_name}: {exc}")
            continue
        for attr in dir(mod):
            if attr.startswith("check_") and callable(getattr(mod, attr)):
                checks.append((team, attr, getattr(mod, attr)))
    return checks


def _aggregate_status(elements):
    statuses = [e.get("check_status", "blocked") for e in elements]
    if any(s == "fail" for s in statuses):
        return "fail"
    if any(s == "warning" for s in statuses):
        return "warning"
    if all(s in ("pass", "log") for s in statuses):
        return "pass"
    return "unknown"


def _build_summary(elements):
    p = sum(1 for e in elements if e.get("check_status") == "pass")
    f = sum(1 for e in elements if e.get("check_status") == "fail")
    w = sum(1 for e in elements if e.get("check_status") == "warning")
    b = sum(1 for e in elements if e.get("check_status") == "blocked")
    total = len(elements)
    parts = []
    if p: parts.append(f"{p} pass")
    if f: parts.append(f"{f} fail")
    if w: parts.append(f"{w} warning")
    if b: parts.append(f"{b} blocked")
    return f"{total} elements: {', '.join(parts)}" if parts else f"{total} elements"


def run_all_checks(ifc_path, job_id, project_id):
    model = ifcopenshell.open(ifc_path)
    checks = discover_checks()
    check_results = []
    element_results = []

    for team, func_name, func in checks:
        check_id = str(uuid.uuid4())
        try:
            elements = func(model)
            status = _aggregate_status(elements)
            summary = _build_summary(elements)

            check_results.append({
                "id": check_id,
                "job_id": job_id,
                "project_id": project_id,
                "check_name": func_name,
                "team": team,
                "status": status,
                "summary": summary,
                "has_elements": 1 if elements else 0,
                "created_at": int(time.time() * 1000),
            })

            for el in elements:
                row = {"id": str(uuid.uuid4()), "check_result_id": check_id}
                for field in TEAM_FIELDS:
                    row[field] = el.get(field)
                element_results.append(row)
        except Exception as exc:
            check_results.append({
                "id": check_id,
                "job_id": job_id,
                "project_id": project_id,
                "check_name": func_name,
                "team": team,
                "status": "error",
                "summary": str(exc)[:200],
                "has_elements": 0,
                "created_at": int(time.time() * 1000),
            })

    return {"check_results": check_results, "element_results": element_results}
