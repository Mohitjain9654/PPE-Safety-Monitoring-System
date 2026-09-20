import { Line } from "@react-three/drei";
import { SKELETON_CONNECTIONS } from "./WorkerUtils";

export default function WorkerSkeleton({ keypoints3D = [], color = null, minConf = 0.2 }) {
  if (!keypoints3D || keypoints3D.length < 17) return null;

  return (
    <>
      {SKELETON_CONNECTIONS.map(([from, to, limbColor], i) => {
        const a = keypoints3D[from];
        const b = keypoints3D[to];
        if (!a || !b) return null;
        if ((a[3] ?? 1) < minConf || (b[3] ?? 1) < minConf) return null;

        return (
          <Line
            key={i}
            points={[[a[0], a[1], a[2]], [b[0], b[1], b[2]]]}
            color={color ?? limbColor}
            lineWidth={2.5}
          />
        );
      })}

      {keypoints3D.map((kp, i) => {
        if (!kp || (kp[3] ?? 1) < minConf) return null;
        const r = i <= 4 ? 0.033 : 0.05;
        return (
          <mesh key={i} position={[kp[0], kp[1], kp[2]]}>
            <sphereGeometry args={[r, 8, 8]} />
            <meshStandardMaterial
              color={color ?? "#ffffff"}
              emissive={color ?? "#ffffff"}
              emissiveIntensity={0.9}
            />
          </mesh>
        );
      })}
    </>
  );
}