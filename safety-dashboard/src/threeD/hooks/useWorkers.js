import { create } from "zustand";
import { fetchKeypoints } from "../services/keypointService";
import { fetchZones }     from "../services/zoneService";
import { map2Dto3D }      from "../utils/map2Dto3D";
import { getWorkerColor } from "../workers/WorkerUtils";
import { normalizeZoneTo3D } from "../rooms/RoomUtils";
import { processViolations } from "../monitoring/ViolationEngine";

const ROOM_W = 20;
const ROOM_L = 15;
const PERSON_H = 1.75;
const HIP_H    = PERSON_H * 0.55;

function mapPersonTo3D(person) {
  const kps = person.keypoints;
  const fw  = person.frame_width;
  const fh  = person.frame_height;

  if (!kps || kps.length < 17) return { base: { x: 0, z: 0 }, keypoints3D: [] };

  const lHip  = kps[11] ?? [fw / 2, fh * 0.55, 0.5];
  const rHip  = kps[12] ?? lHip;
  const hipPX = (lHip[0] + rHip[0]) / 2;
  const hipPY = (lHip[1] + rHip[1]) / 2;
  const base  = map2Dto3D(hipPX, hipPY, fw, fh, ROOM_W, ROOM_L);

  const nosePY    = kps[0]?.[1] ?? (hipPY - fh * 0.28);
  const span      = Math.max(Math.abs(hipPY - nosePY), fh * 0.06);
  const scaleY    = (PERSON_H * 0.58) / span;

  const keypoints3D = kps.map(([px, py, conf = 1]) => {
    const x3D = (px / fw) * ROOM_W - ROOM_W / 2;
    const z3D = (py / fh) * ROOM_L - ROOM_L / 2;
    const y3D = Math.max(HIP_H + (hipPY - py) * scaleY, 0.02);
    return [x3D, y3D, z3D, conf];
  });

  return { base, keypoints3D };
}

export const useWorkerStore = create((set, get) => ({
  workers: [],
  zones:   [],
  zones3D: [],

  startPolling() {
    // Poll keypoints
    const kpTimer = setInterval(async () => {
      try {
        const data = await fetchKeypoints();
        if (!Array.isArray(data)) return;

        const { zones3D } = get();

        const raw = data.map((person) => {
          const { base, keypoints3D } = mapPersonTo3D(person);
          const prev    = get().workers.find((w) => w.id === person.id);
          const history = prev?.history ?? [];
          return {
            id:          person.id,
            x:           base.x,
            z:           base.z,
            keypoints3D,
            violations:  person.violations ?? [],
            color:       getWorkerColor(person.violations),
            history:     [...history, [base.x, 0.05, base.z]].slice(-20),
          };
        });

        const workers = processViolations(raw, zones3D);
        set({ workers });
      } catch (e) {
        console.error("keypoint poll:", e);
      }
    }, 300);

    // Poll zones every 2s
    const zTimer = setInterval(async () => {
      try {
        const data   = await fetchZones();
        const zones3D = (data ?? []).map((z) => normalizeZoneTo3D(z));
        set({ zones: data ?? [], zones3D });
      } catch (e) {
        console.error("zone poll:", e);
      }
    }, 2000);

    return () => { clearInterval(kpTimer); clearInterval(zTimer); };
  },
}));