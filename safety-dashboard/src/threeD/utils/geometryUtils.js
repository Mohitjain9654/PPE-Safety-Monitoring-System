/**
 * Compute the centroid (average point) of a polygon.
 * Polygon points: [x, y, z]
 *
 * @param {Array[]} points
 * @returns {{ x: number, y: number, z: number }}
 */
export function getCentroid(points) {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0, z: 0 };

  const sum = points.reduce(
    (acc, p) => ({
      x: acc.x + p[0],
      y: acc.y + p[1],
      z: acc.z + p[2],
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: sum.x / n,
    y: sum.y / n,
    z: sum.z / n,
  };
}

/**
 * Euclidean distance between two XZ points.
 *
 * @param {number} x1
 * @param {number} z1
 * @param {number} x2
 * @param {number} z2
 * @returns {number}
 */
export function distanceXZ(x1, z1, x2, z2) {
  return Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
}

/**
 * Get axis-aligned bounding box of a polygon (XZ plane).
 *
 * @param {Array[]} points - [x, y, z]
 * @returns {{ minX, maxX, minZ, maxZ }}
 */
export function getBoundingBox(points) {
  const xs = points.map((p) => p[0]);
  const zs = points.map((p) => p[2]);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  };
}

/**
 * Compute area of a polygon using the Shoelace formula (XZ plane).
 *
 * @param {Array[]} points - [x, y, z]
 * @returns {number}
 */
export function polygonArea(points) {
  const n = points.length;
  let area = 0;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    area += (points[i][0] + points[j][0]) * (points[i][2] - points[j][2]);
  }

  return Math.abs(area / 2);
}