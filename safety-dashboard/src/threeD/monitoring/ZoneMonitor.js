import { pointInPolygon } from "../utils/pointInPolygon";

/**
 * ZoneMonitor.js
 *
 * Given a list of workers and a list of zones (polygon point arrays),
 * returns a map of workerId → array of zone indices the worker is inside.
 *
 * Usage:
 *   const zoneMap = monitorZones(workers, zones3D);
 *   // zoneMap[worker.id] = [0, 2]  → inside zone 0 and zone 2
 */

/**
 * @param {Array}   workers  - [{ id, x, z, ... }]
 * @param {Array[]} zones    - array of polygon point arrays [[x,y,z], ...]
 * @returns {Object}         - { [workerId]: number[] }
 */
export function monitorZones(workers, zones) {
  const result = {};

  workers.forEach((worker) => {
    const insideZones = [];

    zones.forEach((zone, zoneIndex) => {
      if (pointInPolygon(worker.x, worker.z, zone)) {
        insideZones.push(zoneIndex);
      }
    });

    result[worker.id] = insideZones;
  });

  return result;
}

/**
 * Returns true if any worker is inside a restricted zone.
 *
 * @param {Array}   workers
 * @param {Array[]} restrictedZones
 * @returns {boolean}
 */
export function hasAnyBreach(workers, restrictedZones) {
  return workers.some((w) =>
    restrictedZones.some((zone) => pointInPolygon(w.x, w.z, zone))
  );
}