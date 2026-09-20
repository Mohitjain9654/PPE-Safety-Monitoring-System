export default function FactoryWalls() {
  const W = 20, L = 15, H = 4, T = 0.18;
  const wallColor  = "#2d3748";
  const trimColor  = "#1a202c";

  return (
    <>
      {/* ── Floor border trim ── */}
      {[
        { pos: [0,    0.01,  L / 2],  args: [W + T * 2, T, T] },
        { pos: [0,    0.01, -L / 2],  args: [W + T * 2, T, T] },
        { pos: [-W/2, 0.01,  0],      args: [T, T, L] },
        { pos: [ W/2, 0.01,  0],      args: [T, T, L] },
      ].map(({ pos, args }, i) => (
        <mesh key={`ft-${i}`} position={pos} castShadow>
          <boxGeometry args={args} />
          <meshStandardMaterial color={trimColor} roughness={0.9} />
        </mesh>
      ))}

      {/* ── Walls ── */}
      {/* Back wall */}
      <mesh position={[0, H / 2, -L / 2]} castShadow receiveShadow>
        <boxGeometry args={[W, H, T]} />
        <meshStandardMaterial color={wallColor} roughness={0.7} />
      </mesh>

      {/* Front wall */}
      <mesh position={[0, H / 2, L / 2]} castShadow receiveShadow>
        <boxGeometry args={[W, H, T]} />
        <meshStandardMaterial color={wallColor} roughness={0.7} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-W / 2, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[T, H, L]} />
        <meshStandardMaterial color={wallColor} roughness={0.7} />
      </mesh>

      {/* Right wall */}
      <mesh position={[W / 2, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[T, H, L]} />
        <meshStandardMaterial color={wallColor} roughness={0.7} />
      </mesh>

      {/* ── Ceiling trim strip ── */}
      {[
        { pos: [0,    H, -L / 2], args: [W, 0.12, 0.12] },
        { pos: [0,    H,  L / 2], args: [W, 0.12, 0.12] },
        { pos: [-W/2, H,  0],     args: [0.12, 0.12, L] },
        { pos: [ W/2, H,  0],     args: [0.12, 0.12, L] },
      ].map(({ pos, args }, i) => (
        <mesh key={`ct-${i}`} position={pos}>
          <boxGeometry args={args} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>
      ))}

      {/* ── Ceiling lights (emissive strips) ── */}
      {[-5, 0, 5].map((x, i) => (
        <mesh key={`light-${i}`} position={[x, H - 0.05, 0]}>
          <boxGeometry args={[0.3, 0.08, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#c8e6ff"
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}

      {/* ── Simple machinery silhouettes (back wall) ── */}
      {[-7, -3, 3, 7].map((x, i) => (
        <mesh key={`mach-${i}`} position={[x, 1.0, -L / 2 + 0.6]} castShadow>
          <boxGeometry args={[1.6, 2.0, 0.9]} />
          <meshStandardMaterial color="#374151" roughness={0.9} metalness={0.3} />
        </mesh>
      ))}
      {/* Machine screens */}
      {[-7, -3, 3, 7].map((x, i) => (
        <mesh key={`screen-${i}`} position={[x, 1.5, -L / 2 + 0.16]}>
          <planeGeometry args={[0.8, 0.55]} />
          <meshStandardMaterial
            color="#1e3a5f"
            emissive="#0066aa"
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}

      {/* ── Work benches ── */}
      {[-6, 0, 6].map((x, i) => (
        <group key={`bench-${i}`} position={[x, 0, L / 2 - 1.2]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[3.5, 0.08, 0.9]} />
            <meshStandardMaterial color="#4a3728" roughness={0.8} />
          </mesh>
          {/* Bench legs */}
          {[-1.6, 1.6].map((lx, j) => (
            <mesh key={j} position={[lx, 0.22, 0]} castShadow>
              <boxGeometry args={[0.07, 0.44, 0.07]} />
              <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}