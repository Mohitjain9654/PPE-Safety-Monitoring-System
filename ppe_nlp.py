def generate_alert(event: dict) -> dict:
    zone = event.get("zone", "Unknown Zone")
    timestamp = event.get("timestamp", "Unknown Time")
    types = event.get("type", [])
    confidence = event.get("confidence", 0)

    violations = []

    mapping = {
        "no_helmet": "helmet",
        "no_vest": "safety vest",
        "no_gloves": "gloves",
        "no_boots": "safety boots"
    }

    for t in types:
        if t in mapping:
            violations.append(mapping[t])

    if not violations:
        message = f"All safety equipment is properly worn in {zone} at {timestamp}."
        severity = "low"
    elif len(violations) == 1:
        message = f"Worker in {zone} is not wearing a {violations[0]} at {timestamp}."
        severity = "medium"
    else:
        items = ", ".join(violations[:-1]) + " and " + violations[-1]
        message = f"Worker in {zone} is not wearing {items} at {timestamp}."
        severity = "high"

    if "no_helmet" in types:
        severity = "high"

    return {
        "message": message,
        "severity": severity,
        "confidence": round(confidence, 2),
        "zone": zone,
        "timestamp": timestamp,
        "violations": types
    }