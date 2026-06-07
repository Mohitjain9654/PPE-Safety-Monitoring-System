function ZoneLabel({ text, color, position }) {
  // Three.js canvas texture se label banana
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = color + '40';
    ctx.roundRect(4, 4, 248, 56, 8);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    return new THREE.CanvasTexture(c);
  }, [text, color]);

  return (
    <mesh position={position} rotation={[-Math.PI/2, 0, 0]}>
      <planeGeometry args={[3.5, 0.8]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

export function ZonePlanes() {
  return (
    <group>
      {/* Safe zone — green */}
      <mesh position={[-4, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[6, 10]} />
        <meshStandardMaterial color="#22c55e" transparent opacity={0.2} />
      </mesh>
      <ZoneLabel text="SAFE ZONE"   color="#22c55e" position={[-4, 0.05, -4]} />

      {/* Entry zone — yellow */}
      <mesh position={[0.5, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[3, 10]} />
        <meshStandardMaterial color="#eab308" transparent opacity={0.18} />
      </mesh>
      <ZoneLabel text="ENTRY / EXIT" color="#eab308" position={[0.5, 0.05, -4]} />

      {/* Restricted zone — red */}
      <mesh position={[4.5, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[5, 10]} />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.22} />
      </mesh>
      <ZoneLabel text="RESTRICTED"  color="#ef4444" position={[4.5, 0.05, -4]} />
    </group>
  );
}