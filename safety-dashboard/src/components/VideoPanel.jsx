import { useState, useRef } from "react";
import axios from "axios";

export default function VideoPanel() {
  const [cameraUrl, setCameraUrl] = useState("");
  const [videoFile, setVideoFile] = useState("");
  const [currentSource, setCurrentSource] = useState("");

  const [drawMode, setDrawMode] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]);

  const videoRef = useRef(null);

  const API = "http://127.0.0.1:8001";

  const startCamera = async () => {
    if (!cameraUrl) {
      return alert("Enter camera URL");
    }

    try {
      await axios.post(`${API}/start-detection`, {
        source: cameraUrl,
      });

      setCurrentSource(cameraUrl);
    } catch (err) {
      console.error(err);
      alert("Failed to connect camera");
    }
  };

  const startVideo = async () => {
    if (!videoFile) {
      return alert("Enter video file");
    }

    try {
      await axios.post(`${API}/start-detection`, {
        source: videoFile,
      });

      setCurrentSource(videoFile);
    } catch (err) {
      console.error(err);
      alert("Failed to load video");
    }
  };

  const handleVideoClick = (e) => {
    if (!drawMode) return;

    const rect =
      videoRef.current.getBoundingClientRect();

    const x =
      (e.clientX - rect.left) / rect.width;

    const y =
      (e.clientY - rect.top) / rect.height;

    setPolygonPoints((prev) => [
      ...prev,
      [x, y],
    ]);
  };

  const saveZone = async () => {
    if (polygonPoints.length < 3) {
      return alert(
        "Select at least 3 points"
      );
    }

    try {
      await axios.post(`${API}/set-zone`, {
        points: polygonPoints,
      });

      alert(
        "Restricted zone saved successfully!"
      );

      setDrawMode(false);
      setPolygonPoints([]);
    } catch (err) {
      console.error(err);

      alert("Failed to save zone");
    }
  };

  const clearZones = async () => {
    const confirmDelete = window.confirm(
      "Delete all restricted zones?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API}/zones`);

      alert("All zones cleared");

      setPolygonPoints([]);

    } catch (err) {
      console.error(err);

      alert("Failed to clear zones");
    }
  };

  return (
    <div className="bg-[#0f1720] p-5 rounded-xl border border-gray-800 space-y-5">

      {/* TITLE */}
      <div>
        <p className="text-green-400 text-sm">
          INPUT SOURCE
        </p>

        <h2 className="text-xl font-semibold">
          Connect camera or test video
        </h2>
      </div>

      {/* INPUTS */}
      <div className="grid grid-cols-2 gap-4">

        {/* Camera */}
        <div className="space-y-2">
          <p className="text-gray-400 text-sm">
            Camera URL
          </p>

          <div className="flex gap-2">
            <input
              value={cameraUrl}
              onChange={(e) =>
                setCameraUrl(e.target.value)
              }
              placeholder="rtsp://192.168.1.10/stream"
              className="bg-black p-2 w-full rounded border border-gray-700 focus:outline-none"
            />

            <button
              onClick={startCamera}
              className="bg-gray-800 hover:bg-gray-700 px-4 rounded"
            >
              Connect
            </button>
          </div>
        </div>

        {/* Video */}
        <div className="space-y-2">
          <p className="text-gray-400 text-sm">
            Test Video
          </p>

          <div className="flex gap-2">
            <input
              value={videoFile}
              onChange={(e) =>
                setVideoFile(e.target.value)
              }
              placeholder="test.mp4"
              className="bg-[#1f2937] p-2 w-full rounded border border-gray-700 focus:outline-none"
            />

            <button
              onClick={startVideo}
              className="bg-gray-800 hover:bg-gray-700 px-4 rounded"
            >
              Load
            </button>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-3 flex-wrap">

        <button className="bg-gray-800 px-4 py-2 rounded hover:bg-gray-700">
          Simulation
        </button>

        <button className="bg-green-600 px-4 py-2 rounded hover:bg-green-700">
          Run Pose
        </button>

        <button
          onClick={() => {
            setDrawMode(!drawMode);
            setPolygonPoints([]);
          }}
          className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
        >
          {drawMode
            ? "Cancel Drawing"
            : "Draw Restricted Zone"}
        </button>

        {drawMode && (
          <button
            onClick={saveZone}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
          >
            Save Zone
          </button>
        )}

        <button
          onClick={clearZones}
          className="bg-red-800 px-4 py-2 rounded hover:bg-red-900"
        >
          Clear Zones
        </button>
      </div>

      {/* STATUS */}
      <div className="text-sm text-gray-400">
        Current source:{" "}
        <span className="text-white">
          {currentSource || "None"}
        </span>
      </div>

      {/* VIDEO */}
      <div
        ref={videoRef}
        className="relative w-full"
        onClick={handleVideoClick}
      >
        <img
          src={`${API}/video_feed`}
          alt="Live Feed"
          className={`w-full h-[400px] object-cover rounded border border-gray-700 ${
            drawMode
              ? "cursor-crosshair"
              : ""
          }`}
        />

        {/* Selected Points */}
        {polygonPoints.map(
          ([x, y], index) => (
            <div
              key={index}
              className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white"
              style={{
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                transform:
                  "translate(-50%, -50%)",
              }}
            />
          )
        )}
      </div>

      {/* POINT COUNT */}
      {drawMode && (
        <div className="text-yellow-400 text-sm">
          Selected Points:{" "}
          {polygonPoints.length}
        </div>
      )}
    </div>
  );
}