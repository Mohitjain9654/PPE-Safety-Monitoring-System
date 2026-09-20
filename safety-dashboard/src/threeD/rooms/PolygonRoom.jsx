import { Line } from "@react-three/drei";

export default function PolygonRoom({
  points = [],
  color = "#ef4444",
}) {
  if (points.length < 3) return null;

  const linePoints = [
    ...points,
    points[0], // close polygon
  ];

  return (
    <Line
      points={linePoints}
      color={color}
      lineWidth={4}
    />
  );
}