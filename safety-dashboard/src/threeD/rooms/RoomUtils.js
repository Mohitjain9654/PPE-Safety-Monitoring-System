export function normalizeZoneTo3D(points, roomWidth = 20, roomLength = 15) {
  return points.map(([nx, ny]) => [
    nx * roomWidth  - roomWidth  / 2,
    0.02,
    ny * roomLength - roomLength / 2,
  ]);
}

export function getZoneColor(type) {
  return { safe: "#22c55e", caution: "#facc15", restricted: "#ef4444" }[type] ?? "#94a3b8";
}