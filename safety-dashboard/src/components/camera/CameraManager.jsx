import { useEffect, useState } from "react";

import AddCamera from "../AddCamera";
import CameraMonitoring from "./CameraMonitoring";

const API = "http://127.0.0.1:8001";

export default function CameraManager({
  mode,
  selectedCameraId,
  onCameraAdded,
  onCameraDeleted,
}) {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);

  // =====================================================
  // FETCH CAMERAS
  // =====================================================

  const fetchCameras = async () => {
    try {
      const response = await fetch(`${API}/cameras`);

      if (!response.ok) {
        throw new Error("Failed to fetch cameras");
      }

      const data = await response.json();

      setCameras(data);

      return data;
    } catch (error) {
      console.error("Camera fetch error:", error);
      return [];
    }
  };

  // =====================================================
  // INITIAL LOAD + AUTO REFRESH
  // =====================================================

  useEffect(() => {
    fetchCameras();

    const interval = setInterval(() => {
      fetchCameras();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // SELECT CAMERA
  // =====================================================

  useEffect(() => {
    if (!selectedCameraId) {
      setSelectedCamera(null);
      return;
    }

    const camera = cameras.find(
      (item) => item.camera_id === selectedCameraId
    );

    setSelectedCamera(camera || null);
  }, [selectedCameraId, cameras]);

  // =====================================================
  // CAMERA ADDED
  // =====================================================

  const handleCameraAdded = async (camera) => {
    await fetchCameras();

    if (onCameraAdded) {
      onCameraAdded(camera);
    }
  };

  // =====================================================
  // DELETE CAMERA
  // =====================================================

  const handleDeleteCamera = async () => {
    if (!selectedCamera) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${selectedCamera.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/cameras/${selectedCamera.camera_id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error || "Failed to delete camera"
        );
      }

      setSelectedCamera(null);

      await fetchCameras();

      if (onCameraDeleted) {
        onCameraDeleted(selectedCamera.camera_id);
      }
    } catch (error) {
      console.error("Delete camera error:", error);

      alert("Camera could not be deleted.");
    }
  };

  // =====================================================
  // ADD CAMERA
  // =====================================================

  if (mode === "add") {
    return (
      <AddCamera
        onCameraAdded={handleCameraAdded}
      />
    );
  }

  // =====================================================
  // CAMERA MONITORING
  // =====================================================

  if (mode === "monitor") {
    if (!selectedCamera) {
      return (
        <div className="bg-[#0f1720] border border-gray-800 rounded-xl p-8">
          <p className="text-gray-400">
            Loading camera...
          </p>
        </div>
      );
    }

    return (
      <CameraMonitoring
        camera={selectedCamera}
        onDelete={handleDeleteCamera}
      />
    );
  }

  // =====================================================
  // DEFAULT
  // =====================================================

  return null;
}