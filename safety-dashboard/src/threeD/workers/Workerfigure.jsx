import { Text, Line } from "@react-three/drei";
import { useRef }      from "react";
import { useFrame }    from "@react-three/fiber";
import WorkerSkeleton  from "./WorkerSkeleton";
import WorkerTrail     from "./WorkerTrail";WorkerSkeleton
import { PERSON_RADIUS, PERSON_HEIGHT } from "./WorkerUtils";

/**
 * Full worker figure:
 *  - Capsule body (cylinder + 2 spheres)
 *  - COCO skeleton overlay
 *  - Color-coded violation glow ring
 *  - Floating label + violation badge
 *  - Movement trail
 */
export default function WorkerFigure({ worker, label = "P1" }) {
  const {
    x, z,
    keypoints3D = [],
    color = "#3b82f6",
    history = [],
    violations = [],
    violationLabels = [],
  } = worker;

  const hasViolation   = violations.length > 0;
  const glowRef        = useRef();
  const basePos        = [x, 0, z];
  const bodyCenter     = [x, PERSON_HEIGHT / 2, z];
  const headPos        = [x, PERSON_HEIGHT + 0.18, z];
  const labelPos       = [x, PERSON_HEIGHT + 0.52, z];
  const badgePos       = [x, PERSON_HEIGHT + 0.82, z];

  // Pulse the glow ring
  useFrame(({ clock }) => {
    if (glowRef.current) {
      const t = clock.getElapsedTime();
      glowRef.current.material.opacity = hasViolation
        ? 0.4 + Math.sin(t * 4) * 0.3
        : 0.0;
    }
  });

  return (
    <>
      {/* Trail */}
      <WorkerTrail points={history} color={color} />

      {/* ── Body capsule ── */}
      {/* Torso cylinder */}
      <mesh position={bodyCenter} castShadow>
        <cylinderGeometry args={[PERSON_RADIUS, PERSON_RADIUS * 0.9, PERSON_HEIGHT, 12]} />
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Head sphere */}
      <mesh position={headPos} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial
          color={color}
          roughness={0.5}
          emissive={color}
          emissiveIntensity={0.2}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* ── Skeleton overlay ── */}
      {keypoints3D.length >= 17 && (
        <WorkerSkeleton keypoints3D={keypoints3D} color={color} />
      )}

      {/* ── Violation glow ring ── */}
      <mesh
        ref={glowRef}
        position={[x, 0.015, z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.38, 0.62, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0}
          emissive={color}
          emissiveIntensity={2}
          depthWrite={false}
        />
      </mesh>

      {/* Shadow dot on floor */}
      <mesh position={[x, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[PERSON_RADIUS * 1.1, 16]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.25} depthWrite={false} />
      </mesh>

      {/* ── Labels ── */}
      <Text
        position={labelPos}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineColor="#000000"
        outlineWidth={0.008}
        renderOrder={10}
      >
        {label}
      </Text>

      {hasViolation && (
        <Text
          position={badgePos}
          fontSize={0.16}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineColor="#000000"
          outlineWidth={0.008}
          renderOrder={10}
        >
          {`⚠ ${violationLabels[0] ?? violations[0]?.replace(/_/g, " ").toUpperCase()}`}
        </Text>
      )}
    </>
  );
}