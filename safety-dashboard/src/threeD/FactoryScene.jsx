import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import Factory from "./factory/Factory";
import AlertOverlay from "./components/AlertOverlay";
import { useWorkerStore } from "./hooks/useWorkers";

export default function FactoryScene() {
  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-gray-700 bg-[#0d1117]">
      {/* 3D Canvas */}
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[16, 14, 16]}
          fov={45}
          near={0.1}
          far={200}
        />

        {/* Lighting — warm industrial feel */}
        <ambientLight intensity={0.6} color="#e8f0ff" />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          color="#fff8e7"
        />
        <directionalLight position={[-8, 12, -8]} intensity={0.4} color="#c8d8ff" />
        <pointLight position={[0, 6, 0]} intensity={0.5} color="#ffffff" distance={30} />

        <Factory />

        <OrbitControls
          target={[0, 0, 0]}
          minDistance={8}
          maxDistance={45}
          maxPolarAngle={Math.PI / 2.15}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      {/* HUD overlay — zone badge top-left */}
      <ZoneBadge />

      {/* Alert overlay */}
      <AlertOverlay />
    </div>
  );
}

function ZoneBadge() {
  return (
    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
      {[
        { label: "SAFE ZONE",       color: "#22c55e", dot: "#16a34a" },
        { label: "CAUTION ZONE",    color: "#facc15", dot: "#ca8a04" },
        { label: "RESTRICTED ZONE", color: "#ef4444", dot: "#dc2626" },
      ].map(({ label, color, dot }) => (
        <div
          key={label}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold"
          style={{
            background: "rgba(0,0,0,0.65)",
            border: `1px solid ${color}44`,
            color,
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: dot }}
          />
          {label}
        </div>
      ))}
    </div>
  );
}