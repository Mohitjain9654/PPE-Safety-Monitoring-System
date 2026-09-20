import { Text } from "@react-three/drei";
import WorkerSkeleton from "./WorkerSkeleton";
import WorkerTrail from "./WorkerTrail";

/**
 * Renders a single worker in 3D:
 *  - Skeleton (if keypoints3D provided)
 *  - Fallback sphere (if no keypoints)
 *  - Movement trail
 *  - Label with violation badge
 *
 * Props:
 *   position    — [x, y, z] base position (hip anchor)
 *   keypoints3D — 17 keypoints in 3D (from WorkerUtils.mapKeypointsTo3D)
 *   color       — status color (#3b82f6 safe / #f97316 PPE / #ef4444 restricted)
 *   label       — "P0", "P1" etc.
 *   history     — array of [x, y, z] past positions for trail
 *   violations  — array of violation strings
 */
export default function WorkerPosition({
  position = [0, 0.5, 0],
  keypoints3D = [],
  color = "#3b82f6",
  label = "P0",
  history = [],
  violations = [],
}) {
  const hasViolation = violations.length > 0;

  return (
    <>
      {/* Movement trail */}
      <WorkerTrail points={history} color={color} />

      {/* Skeleton if keypoints available, else sphere */}
      {keypoints3D.length >= 17 ? (
        <WorkerSkeleton
          keypoints3D={keypoints3D}
          color={color}
        />
      ) : (
        <mesh position={position}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
          />
        </mesh>
      )}

      {/* Violation glow ring on floor */}
      {hasViolation && (
        <mesh
          position={[position[0], 0.02, position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.35, 0.55, 32]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.7}
            emissive={color}
            emissiveIntensity={1}
          />
        </mesh>
      )}

      {/* Name label */}
      <Text
        position={[position[0], position[1] + 1.2, position[2]]}
        fontSize={0.22}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineColor="black"
        outlineWidth={0.01}
      >
        {label}
      </Text>

      {/* Violation badge */}
      {hasViolation && (
        <Text
          position={[position[0], position[1] + 1.5, position[2]]}
          fontSize={0.18}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineColor="black"
          outlineWidth={0.01}
        >
          ⚠ {violations[0]?.replace(/_/g, " ").toUpperCase()}
        </Text>
      )}
    </>
  );
}