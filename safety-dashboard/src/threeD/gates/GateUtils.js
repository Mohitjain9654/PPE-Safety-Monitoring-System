/**
 * GateUtils.js
 * Helpers for entry gate — headcount tracking and crossing detection.
 */

/**
 * Check if a worker (x, z) is currently standing inside the gate zone.
 *
 * @param {number} x
 * @param {number} z
 * @param {number[]} gatePosition - [gx, gy, gz]
 * @param {number[]} gateSize     - [width, depth]
 * @returns {boolean}
 */
export function isInGate(x, z, gatePosition, gateSize) {
  const [gx, , gz] = gatePosition;
  const [w, d]      = gateSize;

  return (
    x >= gx - w / 2 &&
    x <= gx + w / 2 &&
    z >= gz - d / 2 &&
    z <= gz + d / 2
  );
}

/**
 * Detect crossing direction for a single worker based on history.
 * Returns "enter" | "exit" | null
 *
 * @param {Array[]} history      - past [x, y, z] positions
 * @param {number[]} gatePos     - gate position
 * @param {number[]} gateSize    - gate size
 * @param {number}   insideZ     - Z value considered "inside" the factory
 */
export function detectCrossing(history, gatePos, gateSize, insideZ = 0) {
  if (history.length < 3) return null;

  const recent = history.slice(-3);
  const wasOutside = recent[0][2] < gatePos[2] - 0.5;
  const isInside   = recent[recent.length - 1][2] > gatePos[2] + 0.5;

  if (wasOutside && isInside) return "enter";
  if (!wasOutside && !isInside && recent[0][2] > gatePos[2]) return "exit";

  return null;
}

/**
 * Count workers currently inside the gate zone.
 *
 * @param {Array} workers   - array of { x, z }
 * @param {number[]} gatePos
 * @param {number[]} gateSize
 * @returns {number}
 */
export function countAtGate(workers, gatePos, gateSize) {
  return workers.filter((w) => isInGate(w.x, w.z, gatePos, gateSize)).length;
}