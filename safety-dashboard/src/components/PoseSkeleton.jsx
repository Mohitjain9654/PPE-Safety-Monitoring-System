import { posePoints } from "../data/poseData";

export default function PoseSkeleton() {
  return (
    <group>

      {posePoints.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.08]} />
          <meshStandardMaterial color="cyan" />
        </mesh>
      ))}

    </group>
  );
}