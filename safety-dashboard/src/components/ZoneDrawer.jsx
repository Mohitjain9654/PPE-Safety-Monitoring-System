import { useState, useRef, useEffect } from "react";

// Video frame ke upar ek canvas overlay
export default function ZoneDrawer({ videoRef, onZoneSaved }) {
  const canvasRef = useRef();
  const [points, setPoints] = useState([]);
  const [drawing, setDrawing] = useState(false);

  const handleClick = (e) => {
    if (!drawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;   // 0-1 normalized
    const y = (e.clientY - rect.top) / rect.height;
    setPoints(prev => [...prev, [x, y]]);
  };

  // Points ko canvas pe draw karo
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    const { width: W, height: H } = canvasRef.current;
    ctx.clearRect(0, 0, W, H);
    if (points.length === 0) return;

    ctx.strokeStyle = '#ef4444';
    ctx.fillStyle = 'rgba(239,68,68,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0][0]*W, points[0][1]*H);
    points.forEach(([x,y]) => ctx.lineTo(x*W, y*H));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Corner dots
    points.forEach(([x,y]) => {
      ctx.beginPath();
      ctx.arc(x*W, y*H, 5, 0, Math.PI*2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    });
  }, [points]);

  const saveZone = () => {
    if (points.length < 3) return;
    // Backend ko bhejo
    fetch("http://127.0.0.1:8001/set-zone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone_type: "restricted", points })
    });
    onZoneSaved?.(points);
    setDrawing(false);
  };

  return (
    <div className="relative">
      {/* Video upar, canvas overlay */}
      <img
        src="http://127.0.0.1:8001/video_feed"
        className="w-full rounded"
        alt="live feed"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full rounded"
        width={640} height={480}
        onClick={handleClick}
        style={{ cursor: drawing ? 'crosshair' : 'default' }}
      />

      {/* Controls */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setDrawing(!drawing)}
          className={`px-3 py-1 rounded text-sm font-medium ${
            drawing ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-200'
          }`}
        >
          {drawing ? 'Drawing...' : 'Draw Restricted Zone'}
        </button>
        {points.length >= 3 && (
          <button onClick={saveZone} className="px-3 py-1 rounded text-sm font-medium bg-green-700 text-white">
            Save Zone ({points.length} pts)
          </button>
        )}
        <button onClick={() => setPoints([])} className="px-3 py-1 rounded text-sm bg-gray-800 text-gray-400">
          Clear
        </button>
      </div>
      {drawing && (
        <p className="text-xs text-yellow-400 mt-1">
          Click on video to place corner points, then Save
        </p>
      )}
    </div>
  );
}