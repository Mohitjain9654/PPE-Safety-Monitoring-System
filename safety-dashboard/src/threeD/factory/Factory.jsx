import { useEffect } from "react";
import FactoryFloor  from "./FactoryFloor";
import FactoryWalls  from "./FactoryWalls";
import FactoryGrid   from "./FactoryGrid";
import Gate          from "../gates/Gate";
import PolygonRoom   from "../rooms/PolygonRoom";
import WorkerFigure  from "../workers/Workerfigure";
import { useWorkerStore } from "../hooks/useWorkers";
import { normalizeZoneTo3D } from "../rooms/RoomUtils";
import { Text } from "@react-three/drei";

export default function Factory() {
  const startPolling = useWorkerStore((s) => s.startPolling);
  const workers      = useWorkerStore((s) => s.workers);
  const zones3D      = useWorkerStore((s) => s.zones3D);

  useEffect(() => {
    const stop = startPolling();
    return stop;
  }, []);

  return (
    <>
      <FactoryFloor />
      <FactoryWalls />
      <FactoryGrid  />

      {/* Entry gate */}
      <Gate
        position={[0, 0.01, -7.4]}
        size={[4, 1.2]}
        color="#facc15"
        label="ENTRY / EXIT"
      />

      {/* User-drawn restricted zones */}
      {zones3D.map((zone, i) => (
        <PolygonRoom
          key={`zone-${i}`}
          points={zone}
          color="#ef4444"
          opacity={0.28}
          label="RESTRICTED ZONE"
        />
      ))}

      {/* Workers */}
      {workers.map((worker, i) => (
        <WorkerFigure
          key={worker.id}
          worker={worker}
          label={`P${i + 1}`}
        />
      ))}

      {/* Floor label */}
      <Text
        position={[0, 0.08, 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.55}
        color="#ffffff"
        fillOpacity={0.12}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
      >
        FACTORY FLOOR
      </Text>
    </>
  );
}