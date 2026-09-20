import { Grid } from "@react-three/drei";

export default function FactoryGrid() {
  return (
    <Grid
      position={[0, 0.012, 0]}
      args={[20, 15]}
      cellSize={1}
      cellThickness={0.3}
      cellColor="#4ade80"
      sectionSize={5}
      sectionThickness={0.6}
      sectionColor="#22c55e"
      fadeDistance={40}
      fadeStrength={1.2}
      infiniteGrid={false}
    />
  );
}