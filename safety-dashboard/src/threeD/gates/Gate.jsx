import { Text } from "@react-three/drei";

export default function Gate({
  position = [0, 0.01, -7.4],
  size     = [4, 1.2],
  color    = "#facc15",
  label    = "ENTRY / EXIT",
}) {
  return (
    <>
      {/* Gate floor marking */}
      <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={size} />
        <meshStandardMaterial color={color} transparent opacity={0.75} depthWrite={false} />
      </mesh>

      {/* Gate outline */}
      {(() => {
        const [w, d] = size;
        const [gx, gy, gz] = position;
        const y = gy + 0.01;
        const pts = [
          [gx - w/2, y, gz - d/2],
          [gx + w/2, y, gz - d/2],
          [gx + w/2, y, gz + d/2],
          [gx - w/2, y, gz + d/2],
          [gx - w/2, y, gz - d/2],
        ];
        return (
          <line>
            <bufferGeometry
              setFromPoints={pts.map(([x, y, z]) => ({ x, y, z }))}
            />
          </line>
        );
      })()}

      {/* Gate posts */}
      {[[-size[0]/2, 0], [size[0]/2, 0]].map(([dx], i) => (
        <mesh key={i} position={[position[0] + dx, 1.0, position[2]]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 2.0, 8]} />
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      ))}

      {/* Crossbar */}
      <mesh position={[position[0], 2.0, position[2]]} castShadow>
        <boxGeometry args={[size[0], 0.08, 0.08]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>

      {/* Label */}
      <Text
        position={[position[0], 2.3, position[2]]}
        fontSize={0.28}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineColor="#000"
        outlineWidth={0.01}
      >
        {label}
      </Text>
    </>
  );
}