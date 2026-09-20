export const PERSON_HEIGHT = 1.75;
export const PERSON_RADIUS = 0.15;

export const KEYPOINT_NAMES = [
  "nose","left_eye","right_eye","left_ear","right_ear",
  "left_shoulder","right_shoulder",
  "left_elbow","right_elbow",
  "left_wrist","right_wrist",
  "left_hip","right_hip",
  "left_knee","right_knee",
  "left_ankle","right_ankle",
];

// [from, to, color]
export const SKELETON_CONNECTIONS = [
  [0,  1,  "#c084fc"], [0,  2,  "#c084fc"],
  [1,  3,  "#c084fc"], [2,  4,  "#c084fc"],
  [5,  6,  "#60a5fa"],
  [5, 11,  "#60a5fa"], [6, 12,  "#60a5fa"],
  [11,12,  "#60a5fa"],
  [5,  7,  "#34d399"], [7,  9,  "#34d399"],
  [6,  8,  "#f87171"], [8, 10,  "#f87171"],
  [11,13,  "#fbbf24"], [13,15,  "#fbbf24"],
  [12,14,  "#fb923c"], [14,16,  "#fb923c"],
];

export function getWorkerColor(violations = []) {
  if (!violations?.length) return "#3b82f6";
  if (violations.includes("restricted_zone_breach")) return "#ef4444";
  return "#f97316";
}