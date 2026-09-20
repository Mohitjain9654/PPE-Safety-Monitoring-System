import { useState } from "react";

export default function AddCamera({ onCameraAdded }) {
  const [cameraName, setCameraName] = useState("");
  const [cameraSource, setCameraSource] = useState("");
  const [cameraType, setCameraType] = useState("RTSP");
  const [loading, setLoading] = useState(false);

  const handleAddCamera = async (e) => {
    e.preventDefault();

    if (!cameraName.trim()) {
      alert("Please enter a camera name.");
      return;
    }

    if (!cameraSource.trim()) {
      alert("Please enter the camera source.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Backend endpoint will be connected
       * in the next step.
       */
      const response = await fetch(
        "http://127.0.0.1:8001/cameras",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: cameraName.trim(),
            source: cameraSource.trim(),
            type: cameraType,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add camera");
      }

      const data = await response.json();

      alert("Camera added successfully!");

      // Tell Sidebar/App that a new camera was added
      if (onCameraAdded) {
        onCameraAdded(data);
      }

      // Clear form
      setCameraName("");
      setCameraSource("");
      setCameraType("RTSP");

    } catch (error) {
      console.error("Add camera error:", error);

      alert(
        "Camera could not be added. Backend camera API is not connected yet."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">

      {/* HEADER */}
      <div className="mb-8">

        <p className="text-green-400 text-xs font-semibold tracking-wider">
          CAMERA MANAGEMENT
        </p>

        <h1 className="text-3xl font-bold text-white mt-2">
          Add Camera
        </h1>

        <p className="text-gray-500 text-sm mt-2">
          Register a new camera for PPE safety monitoring.
        </p>

      </div>


      {/* FORM CARD */}
      <div className="bg-[#0f1720] border border-gray-800 rounded-xl p-6">

        <form
          onSubmit={handleAddCamera}
          className="space-y-6"
        >

          {/* CAMERA NAME */}

          <div>

            <label className="block text-sm text-gray-300 mb-2">
              Camera Name
            </label>

            <input
              type="text"
              value={cameraName}
              onChange={(e) =>
                setCameraName(e.target.value)
              }
              placeholder="e.g. LAB AF09"
              className="w-full bg-[#111827] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
            />

            <p className="text-xs text-gray-600 mt-2">
              This name will appear in the Camera section of the sidebar.
            </p>

          </div>


          {/* CAMERA TYPE */}

          <div>

            <label className="block text-sm text-gray-300 mb-2">
              Camera Type
            </label>

            <select
              value={cameraType}
              onChange={(e) =>
                setCameraType(e.target.value)
              }
              className="w-full bg-[#111827] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
            >

              <option value="RTSP">
                RTSP Camera
              </option>

              <option value="HTTP">
                HTTP Camera
              </option>

              <option value="USB">
                USB Camera
              </option>

              <option value="VIDEO">
                Test Video
              </option>

            </select>

          </div>


          {/* SOURCE */}

          <div>

            <label className="block text-sm text-gray-300 mb-2">
              Camera Source
            </label>

            <input
              type="text"
              value={cameraSource}
              onChange={(e) =>
                setCameraSource(e.target.value)
              }
              placeholder="rtsp://192.168.1.10:554/stream"
              className="w-full bg-[#111827] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
            />

            <p className="text-xs text-gray-600 mt-2">
              Enter the RTSP/HTTP stream URL or video file path.
            </p>

          </div>


          {/* PREVIEW INFO */}

          <div className="bg-[#111827] border border-gray-800 rounded-lg p-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <span className="text-xl">
                  📹
                </span>
              </div>

              <div>

                <p className="text-sm text-white">
                  {cameraName || "New Camera"}
                </p>

                <p className="text-xs text-gray-500">
                  {cameraType} •{" "}
                  {cameraSource || "No source configured"}
                </p>

              </div>

            </div>

          </div>


          {/* BUTTONS */}

          <div className="flex justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={() => {
                setCameraName("");
                setCameraSource("");
                setCameraType("RTSP");
              }}
              className="px-5 py-2.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
            >
              Clear
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading
                ? "Adding..."
                : "Add Camera"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}