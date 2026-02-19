"""Demo check: counts doors and verifies minimum count."""


def check_door_count(model, min_doors=2):
    doors = model.by_type("IfcDoor")
    results = []
    for door in doors:
        name = door.Name or f"Door #{door.id()}"
        results.append({
            "element_id": door.GlobalId,
            "element_type": "IfcDoor",
            "element_name": name,
            "element_name_long": None,
            "check_status": "pass",
            "actual_value": "Present",
            "required_value": f">= {min_doors} doors total",
            "comment": None,
            "log": None,
        })
    if len(doors) < min_doors:
        results.append({
            "element_id": None,
            "element_type": "Summary",
            "element_name": "Door Count Check",
            "element_name_long": None,
            "check_status": "fail",
            "actual_value": f"{len(doors)} doors",
            "required_value": f">= {min_doors} doors",
            "comment": f"Found {len(doors)} doors, need >= {min_doors}",
            "log": None,
        })
    return results
