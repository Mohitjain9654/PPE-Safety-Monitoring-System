export default function Room({
  position = [0, 0.02, 0],
  size = [4, 4],
  color = "#22c55e",
}) {
  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={size} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}