import { isInGate } from "../gates/GateUtils";

/**
 * EntryDetector.js
 *
 * Maintains a record of which workers are currently at/near the gate
 * and detects entry/exit crossing events.
 *
 * Usage (call every frame / poll cycle):
 *   const detector = new EntryDetector(gateConfig);
 *   const events   = detector.update(workers);
 *   // events = [{ workerId, type: "enter"|"exit", timestamp }]
 */

export class EntryDetector {
  /**
   * @param {{ position: number[], size: number[] }} gate
   */
  constructor(gate) {
    this.gate    = gate;
    this.inGate  = new Set();   // worker ids currently in gate zone
    this.entered = 0;
    this.exited  = 0;
  }

  /**
   * Update detector with current worker positions.
   *
   * @param {Array} workers - [{ id, x, z }]
   * @returns {Array} crossing events this tick
   */
  update(workers) {
    const events = [];
    const nowInGate = new Set();

    workers.forEach((w) => {
      if (isInGate(w.x, w.z, this.gate.position, this.gate.size)) {
        nowInGate.add(w.id);

        if (!this.inGate.has(w.id)) {
          // Worker just entered gate zone → count as entry
          this.entered++;
          events.push({
            workerId:  w.id,
            type:      "enter",
            timestamp: Date.now(),
          });
        }
      } else {
        if (this.inGate.has(w.id)) {
          // Worker just left gate zone → count as exit
          this.exited++;
          events.push({
            workerId:  w.id,
            type:      "exit",
            timestamp: Date.now(),
          });
        }
      }
    });

    this.inGate = nowInGate;
    return events;
  }

  getHeadcount() {
    return this.inGate.size;
  }

  getStats() {
    return {
      entered: this.entered,
      exited:  this.exited,
      atGate:  this.inGate.size,
    };
  }

  reset() {
    this.inGate  = new Set();
    this.entered = 0;
    this.exited  = 0;
  }
}