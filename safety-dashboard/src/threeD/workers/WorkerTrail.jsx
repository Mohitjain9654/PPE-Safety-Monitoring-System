import { Line } from "@react-three/drei";

export default function WorkerTrail({ points = [], color = "#60a5fa" }) {
  if (points.length < 2) return null;
  return <Line points={points} color={color} lineWidth={1.5} transparent opacity={0.45} />;
}