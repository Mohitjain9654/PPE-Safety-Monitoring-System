export default function FactoryFloor() {
  return (
    <>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial color="#1a2e1a" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Green safe zone overlay (whole floor default) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial
          color="#22c55e"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      {/* Caution zone — middle strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 1]}>
        <planeGeometry args={[14, 4]} />
        <meshStandardMaterial
          color="#facc15"
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>

      {/* Floor stripe markings */}
      {[-7, -3.5, 3.5, 7].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.007, 0]}>
          <planeGeometry args={[0.08, 15]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.06} depthWrite={false} />
        </mesh>
      ))}
      {[-5, 0, 5].map((z, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, z]}>
          <planeGeometry args={[20, 0.08]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.06} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}