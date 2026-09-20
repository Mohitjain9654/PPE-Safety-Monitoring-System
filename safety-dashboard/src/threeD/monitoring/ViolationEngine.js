import { pointInPolygon } from "../utils/pointInPolygon";

const LABELS = {
  no_helmet:              "Missing Helmet",
  no_vest:                "Missing Vest",
  no_gloves:              "Missing Gloves",
  no_goggles:             "Missing Goggles",
  no_mask:                "Missing Mask",
  no_boots:               "Missing Boots",
  restricted_zone_breach: "Zone Breach",
};

export const STATUS_COLORS = {
  safe:          "#3b82f6",
  ppe_violation: "#f97316",
  zone_breach:   "#ef4444",
};

export function processViolations(workers, restrictedZones = []) {
  return workers.map((w) => {
    const base = [...(w.violations ?? [])];

    const inZone =
      restrictedZones.length > 0 &&
      restrictedZones.some((z) => pointInPolygon(w.x, w.z, z));

    if (inZone && !base.includes("restricted_zone_breach")) {
      base.push("restricted_zone_breach");
    }

    const status = base.includes("restricted_zone_breach")
      ? "zone_breach"
      : base.length > 0 ? "ppe_violation" : "safe";

    return {
      ...w,
      violations:      base,
      status,
      statusColor:     STATUS_COLORS[status],
      violationLabels: base.map((k) => LABELS[k] ?? k.replace(/_/g, " ")),
    };
  });
}