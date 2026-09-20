/**
 * Ray-casting algorithm to check if a 2D point is inside a polygon.
 * Works in XZ plane (3D factory floor).
 *
 * @param {number} px - point X
 * @param {number} pz - point Z
 * @param {Array}  polygon - array of [x, 0, z] 3D points
 * @returns {boolean}
 */
export function pointInPolygon(px, pz, polygon) {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0];
    const zi = polygon[i][2];
    const xj = polygon[j][0];
    const zj = polygon[j][2];

    const intersect =
      zi > pz !== zj > pz &&
      px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Check if a worker (x, z) is inside any of the given zones.
 * Each zone is an array of [x, y, z] 3D points (y ignored).
 *
 * @param {number} x
 * @param {number} z
 * @param {Array[]} zones - array of polygon point arrays
 * @returns {boolean}
 */
export function isInAnyZone(x, z, zones) {
  return zones.some((zone) => pointInPolygon(x, z, zone));
}