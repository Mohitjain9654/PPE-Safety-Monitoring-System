import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8001";

export default function Sidebar({ onMenuChange }) {
  const [active, setActive] = useState("Home");
  const [cameras, setCameras] = useState([]);
  const [loadingCameras, setLoadingCameras] = useState(true);
  const [backendStatus, setBackendStatus] = useState("checking");

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

    } catch (error) {
      console.error(
        "Failed to fetch cameras:",
        error
      );
    } finally {
      setLoadingCameras(false);
    }
  };


  // =====================================================
  // INITIAL LOAD + REAL-TIME REFRESH
  // =====================================================

  useEffect(() => {
    fetchCameras();
    checkBackendStatus();

    const cameraInterval = setInterval(() => {
      fetchCameras();
    }, 3000);

    const backendInterval = setInterval(() => {
      checkBackendStatus();
    }, 5000);

    return () => {
      clearInterval(cameraInterval);
      clearInterval(backendInterval);
    };
  }, []);


  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleMenuClick = (name) => {
    setActive(name);

    if (onMenuChange) {
      onMenuChange(name);
    }
  };


  // =====================================================
  // CAMERA CLICK
  // =====================================================

  const handleCameraClick = (cameraId) => {
    const page = `camera:${cameraId}`;

    setActive(page);

    if (onMenuChange) {
      onMenuChange(page);
    }
  };

  // =====================================================
  // check backend status
  // =====================================================

  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${API}/cameras`, {
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error("Backend unavailable");
      }

      setBackendStatus("connected");
    } catch (error) {
      setBackendStatus("disconnected");
    }
  };


  return (
    <div className="w-64 h-screen bg-[#0b1220] border-r border-gray-800 flex flex-col">


      {/* =================================================
          LOGO
      ================================================= */}

      <div className="p-5 border-b border-gray-800">

        <h1 className="text-xl font-bold text-green-400 tracking-wide">
          SafetyOps AI
        </h1>

        <p className="text-xs text-gray-400 mt-1">
          PPE Monitoring
        </p>

      </div>


      {/* =================================================
          MAIN NAVIGATION
      ================================================= */}

      <div className="p-4 space-y-2">


        {/* HOME */}

        <MenuItem
          name="Home"
          icon="📊"
          active={active === "Home"}
          onClick={() =>
            handleMenuClick("Home")
          }
        />


        {/* ANALYTICS */}

        <MenuItem
          name="Analytics"
          icon="📈"
          active={active === "Analytics"}
          onClick={() =>
            handleMenuClick("Analytics")
          }
        />


        {/* REPORTS */}

        <MenuItem
          name="Reports"
          icon="📄"
          active={active === "Reports"}
          onClick={() =>
            handleMenuClick("Reports")
          }
        />

      </div>


      {/* =================================================
          CAMERAS
      ================================================= */}

      <div className="flex-1 px-4 overflow-y-auto">


        {/* HEADER */}

        <div className="flex items-center justify-between px-2 mb-3">

          <div className="flex items-center gap-2">

            <span className="text-xs font-semibold text-gray-500 tracking-wider">
              CAMERAS
            </span>

            {cameras.length > 0 && (
              <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
                {cameras.length}
              </span>
            )}

          </div>

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {loadingCameras && (
          <div className="px-3 py-3">

            <div className="flex items-center gap-2">

              <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />

              <span className="text-xs text-gray-500">
                Loading cameras...
              </span>

            </div>

          </div>
        )}


        {/* =================================================
            NO CAMERAS
        ================================================= */}

        {!loadingCameras &&
          cameras.length === 0 && (
            <div className="px-3 py-3">

              <p className="text-xs text-gray-600">
                No cameras added yet.
              </p>

            </div>
          )}


        {/* =================================================
            CAMERA LIST
        ================================================= */}

        <div className="space-y-1">

          {cameras.map((camera) => {

            const isActive =
              active ===
              `camera:${camera.camera_id}`;


            const status =
              camera.status;


            const isOnline =
              status === "online";


            const isStarting =
              status === "starting" ||
              status === "connecting";


            return (
              <button
                key={camera.camera_id}
                onClick={() =>
                  handleCameraClick(
                    camera.camera_id
                  )
                }
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left ${isActive
                    ? "bg-green-600/20 border border-green-500/30"
                    : "hover:bg-gray-800/70"
                  }`}
              >

                {/* CAMERA ICON */}

                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive
                      ? "bg-green-500/20"
                      : "bg-gray-800"
                    }`}
                >
                  <span className="text-sm">
                    📹
                  </span>
                </div>


                {/* CAMERA INFO */}

                <div className="flex-1 min-w-0">

                  <p
                    className={`text-sm font-medium truncate ${isActive
                        ? "text-white"
                        : "text-gray-300"
                      }`}
                  >
                    {camera.name}
                  </p>


                  <div className="flex items-center gap-1.5 mt-0.5">

                    {/* STATUS DOT */}

                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isOnline
                          ? "bg-green-400"
                          : isStarting
                            ? "bg-yellow-400 animate-pulse"
                            : "bg-gray-600"
                        }`}
                    />


                    {/* STATUS TEXT */}

                    <span
                      className={`text-[10px] ${isOnline
                          ? "text-green-400"
                          : isStarting
                            ? "text-yellow-400"
                            : "text-gray-600"
                        }`}
                    >
                      {isOnline
                        ? "Live"
                        : isStarting
                          ? "Connecting"
                          : "Offline"}
                    </span>

                  </div>

                </div>


                {/* ARROW */}

                <span
                  className={`text-xs ${isActive
                      ? "text-green-400"
                      : "text-gray-700"
                    }`}
                >
                  ›
                </span>

              </button>
            );
          })}

        </div>


        {/* =================================================
            ADD CAMERA
        ================================================= */}

        <button
          onClick={() =>
            handleMenuClick("Add Camera")
          }
          className={`w-full mt-3 flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed transition ${active === "Add Camera"
              ? "border-green-500/50 bg-green-500/10 text-green-400"
              : "border-gray-700 text-gray-500 hover:border-green-500/40 hover:text-green-400 hover:bg-gray-800/40"
            }`}
        >

          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">

            <span className="text-lg">
              +
            </span>

          </div>

          <span className="text-sm font-medium">
            Add Camera
          </span>

        </button>

      </div>


      {/* =================================================
          BOTTOM MENU
      ================================================= */}

      <div className="p-4 border-t border-gray-800">


        {/* SETTINGS */}

        <MenuItem
          name="Settings"
          icon="⚙️"
          active={active === "Settings"}
          onClick={() =>
            handleMenuClick("Settings")
          }
        />


        {/* BACKEND STATUS */}

        {/* BACKEND STATUS */}
        <div className="mt-3 px-3 py-2.5 bg-[#111827] rounded-lg">
          <div className="flex items-center gap-2">

            {/* STATUS DOT */}
            <span
              className={`w-2 h-2 rounded-full ${backendStatus === "connected"
                  ? "bg-green-400"
                  : backendStatus === "disconnected"
                    ? "bg-red-400"
                    : "bg-yellow-400 animate-pulse"
                }`}
            />

            {/* STATUS TEXT */}
            <span
              className={`text-xs ${backendStatus === "connected"
                  ? "text-green-400"
                  : backendStatus === "disconnected"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
            >
              {backendStatus === "connected"
                ? "Backend Connected"
                : backendStatus === "disconnected"
                  ? "Backend Disconnected"
                  : "Checking Backend..."}
            </span>

          </div>
        </div>

      </div>

    </div>
  );
}


// =========================================================
// REUSABLE MENU ITEM
// =========================================================

function MenuItem({
  name,
  icon,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 text-left ${active
          ? "bg-green-600 text-white shadow-md"
          : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`}
    >

      <span>
        {icon}
      </span>

      <span className="text-sm font-medium">
        {name}
      </span>

    </button>
  );
}

// import { useState } from "react";

// export default function Sidebar({ onMenuChange }) {
//   const [active, setActive] = useState("Dashboard");

//   const menu = [
//     { name: "Dashboard", icon: "📊" },
//     { name: "Analytics", icon: "📈" },
//     { name: "Reports", icon: "📄" },
//     { name: "Settings", icon: "⚙️" },
//   ];

//   const handleMenuClick = (name) => {
//     setActive(name);
//     onMenuChange(name);
//   };

//   return (
//     <div className="w-64 h-screen bg-[#0b1220] border-r border-gray-800 flex flex-col">

//       {/* LOGO */}
//       <div className="p-5 border-b border-gray-800">
//         <h1 className="text-xl font-bold text-green-400 tracking-wide">
//           SafetyOps AI
//         </h1>

//         <p className="text-xs text-gray-400">
//           PPE Monitoring
//         </p>
//       </div>

//       {/* MENU */}
//       <div className="flex-1 p-4 space-y-2">
//         {menu.map((item) => (
//           <div
//             key={item.name}
//             onClick={() => handleMenuClick(item.name)}
//             className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200
//               ${
//                 active === item.name
//                   ? "bg-green-600 text-white shadow-md"
//                   : "text-gray-400 hover:bg-gray-800 hover:text-white"
//               }`}
//           >
//             <span>{item.icon}</span>
//             <span className="text-sm font-medium">
//               {item.name}
//             </span>
//           </div>
//         ))}
//       </div>

//       {/* STATUS */}
//       <div className="p-4 border-t border-gray-800">
//         <div className="flex items-center gap-2 text-sm">
//           <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
//           <span className="text-green-400">
//             Backend connected
//           </span>
//         </div>
//       </div>

//     </div>
//   );
// }