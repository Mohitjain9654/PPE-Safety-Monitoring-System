import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8001";

export default function CameraMonitoring({
  camera,
  onDelete,
}) {
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // =====================================================
  // START CAMERA
  // =====================================================

  const startMonitoring = async () => {
    if (!camera) return;

    setStatus("connecting");
    setError("");

    try {
      const response = await fetch(
        `${API}/cameras/${camera.camera_id}/start`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error || "Failed to start camera"
        );
      }

      // Backend may return "already_running"
      // or "started"
      if (
        data.status === "started" ||
        data.status === "already_running"
      ) {
        setStatus("online");
      } else {
        setStatus("offline");
      }

    } catch (err) {
      console.error(
        "Camera start error:",
        err
      );

      setStatus("offline");

      setError(
        err.message ||
        "Unable to connect to camera."
      );
    }
  };


  // =====================================================
  // STOP CAMERA
  // =====================================================

  const stopMonitoring = async () => {
    if (!camera) return;

    try {
      setStatus("stopping");

      const response = await fetch(
        `${API}/cameras/${camera.camera_id}/stop`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error || "Failed to stop camera"
        );
      }

      setStatus("offline");

    } catch (err) {
      console.error(
        "Camera stop error:",
        err
      );

      setError(
        err.message ||
        "Unable to stop camera."
      );

      setStatus("online");
    }
  };


  // =====================================================
  // DELETE CAMERA
  // =====================================================

  const handleDelete = async () => {
    if (!camera) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${camera.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      // Stop first
      await fetch(
        `${API}/cameras/${camera.camera_id}/stop`,
        {
          method: "POST",
        }
      );

      // Then parent handles actual delete
      if (onDelete) {
        await onDelete();
      }

    } catch (err) {
      console.error(
        "Delete camera error:",
        err
      );

      alert(
        "Camera could not be deleted."
      );

      setDeleting(false);
    }
  };


  // =====================================================
  // START CAMERA WHEN PAGE OPENS
  // =====================================================

  useEffect(() => {
    if (!camera) return;

    startMonitoring();

    return () => {
      /*
       * We intentionally do not stop the camera here.
       *
       * This prevents React re-renders from accidentally
       * stopping a running detection thread.
       */
    };
  }, [camera?.camera_id]);


  // =====================================================
  // NO CAMERA
  // =====================================================

  if (!camera) {
    return (
      <div className="bg-[#0f1720] border border-gray-800 rounded-xl p-8">

        <p className="text-gray-400">
          Camera not found.
        </p>

      </div>
    );
  }


  // =====================================================
  // STATUS HELPERS
  // =====================================================

  const isOnline =
    status === "online";

  const isConnecting =
    status === "connecting";

  const isStopping =
    status === "stopping";


  return (
    <div className="space-y-6">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex items-center justify-between">


        {/* CAMERA TITLE */}

        <div>

          <p className="text-green-400 text-xs font-semibold tracking-wider">
            CAMERA MONITORING
          </p>

          <h1 className="text-3xl font-bold text-white mt-1">
            {camera.name}
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            {camera.type} Camera
          </p>

        </div>


        {/* ACTIONS */}

        <div className="flex items-center gap-3">


          {/* STATUS */}

          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111827] border border-gray-800">

            <span
              className={`w-2 h-2 rounded-full ${
                isOnline
                  ? "bg-green-400 animate-pulse"
                  : isConnecting
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-gray-500"
              }`}
            />

            <span
              className={`text-sm ${
                isOnline
                  ? "text-green-400"
                  : isConnecting
                  ? "text-yellow-400"
                  : "text-gray-400"
              }`}
            >
              {isOnline
                ? "LIVE"
                : isConnecting
                ? "CONNECTING"
                : isStopping
                ? "STOPPING"
                : "OFFLINE"}
            </span>

          </div>


          {/* START */}

          {!isOnline &&
            !isConnecting &&
            !isStopping && (
              <button
                onClick={startMonitoring}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition"
              >
                Start Monitoring
              </button>
            )}


          {/* STOP */}

          {isOnline && (
            <button
              onClick={stopMonitoring}
              className="px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 text-sm font-medium transition"
            >
              Stop Monitoring
            </button>
          )}


          {/* DELETE */}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
          >
            {deleting
              ? "Deleting..."
              : "Delete Camera"}
          </button>

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-red-400 text-sm font-medium">
                Camera Connection Error
              </p>

              <p className="text-red-400/70 text-xs mt-1">
                {error}
              </p>

            </div>


            <button
              onClick={startMonitoring}
              className="text-sm text-red-300 hover:text-white underline"
            >
              Retry
            </button>

          </div>

        </div>
      )}


      {/* =================================================
          VIDEO PANEL
      ================================================= */}

      <div className="bg-[#0f1720] border border-gray-800 rounded-xl overflow-hidden">

        <div className="relative bg-black min-h-[600px]">


          {/* =================================================
              OFFLINE STATE
          ================================================= */}

          {!isOnline && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">

              <div className="text-center">

                {isConnecting && (
                  <>
                    <div className="w-10 h-10 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

                    <p className="text-gray-400">
                      Connecting to{" "}
                      {camera.name}...
                    </p>
                  </>
                )}


                {isStopping && (
                  <>
                    <div className="w-10 h-10 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

                    <p className="text-gray-400">
                      Stopping camera...
                    </p>
                  </>
                )}


                {status === "offline" && (
                  <>
                    <div className="text-5xl mb-4">
                      📹
                    </div>

                    <p className="text-gray-400">
                      Camera is offline
                    </p>

                    <button
                      onClick={startMonitoring}
                      className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
                    >
                      Start Monitoring
                    </button>
                  </>
                )}

              </div>

            </div>
          )}


          {/* =================================================
              CAMERA STREAM
          ================================================= */}

          {isOnline && (
            <img
              src={`${API}/cameras/${camera.camera_id}/video_feed`}
              alt={`${camera.name} live feed`}
              className="w-full h-[600px] object-contain"
            />
          )}


          {/* =================================================
              LIVE BADGE
          ================================================= */}

          {isOnline && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg">

              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />

              <span className="text-xs text-white font-semibold">
                LIVE
              </span>

            </div>
          )}


          {/* =================================================
              CAMERA NAME
          ================================================= */}

          {isOnline && (
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-4 py-3 rounded-lg">

              <p className="text-sm font-semibold text-white">
                {camera.name}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                {camera.type}
              </p>

            </div>
          )}

        </div>

      </div>


      {/* =================================================
          CAMERA INFORMATION
      ================================================= */}

      <div className="grid grid-cols-3 gap-4">


        {/* CAMERA */}

        <InfoCard
          label="CAMERA"
          value={camera.name}
        />


        {/* TYPE */}

        <InfoCard
          label="TYPE"
          value={camera.type}
        />


        {/* STATUS */}

        <InfoCard
          label="STATUS"
          value={
            isOnline
              ? "Monitoring"
              : "Offline"
          }
          green={isOnline}
        />

      </div>

    </div>
  );
}


// =========================================================
// INFO CARD
// =========================================================

function InfoCard({
  label,
  value,
  green = false,
}) {
  return (
    <div className="bg-[#0f1720] border border-gray-800 rounded-xl p-4">

      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p
        className={`font-medium mt-1 ${
          green
            ? "text-green-400"
            : "text-white"
        }`}
      >
        {value}
      </p>

    </div>
  );
}