import { Line, Text } from "@react-three/drei";
import { useMemo }    from "react";
import * as THREE     from "three";
import { getCentroid } from "../utils/geometryUtils";

export default function PolygonRoom({
  points  = [],
  color   = "#ef4444",
  opacity = 0.28,
  label   = "",
}) {
  if (points.length < 3) return null;

  const linePoints = [...points, points[0]];

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(points[0][0], points[0][2]);
    for (let i = 1; i < points.length; i++) s.lineTo(points[i][0], points[i][2]);
    s.closePath();
    return s;
  }, [points]);

  const centroid = getCentroid(points);

  return (
    <>
      {/* Filled floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outline */}
      <Line points={linePoints} color={color} lineWidth={3} />

      {/* Zone label */}
      {label && (
        <Text
          position={[centroid.x, 0.12, centroid.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.4}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineColor="#000"
          outlineWidth={0.01}
          fillOpacity={0.85}
          letterSpacing={0.06}
        >
          {label}
        </Text>
      )}
    </>
  );
}