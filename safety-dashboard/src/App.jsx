import { useState } from "react";

import Sidebar from "./components/Sidebar";
import VideoPanel from "./components/VideoPanel";
import EventLog from "./components/EventLog";
import LatestAlert from "./components/LatestAlert";
import Analytics from "./components/Analytics";

import CameraManager from "./components/camera/CameraManager";
import Reports from "./components/reports/Reports";
import Settings from "./components/Settings";

export default function App() {
  const [activePage, setActivePage] = useState("Home");

  const handleNavigation = (page) => {
    setActivePage(page);
  };

  const isCameraPage = activePage.startsWith("camera:");

  const selectedCameraId = isCameraPage
    ? activePage.replace("camera:", "")
    : null;

  return (
    // Full screen layout — outer page will not scroll
    <div className="flex h-screen overflow-hidden bg-[#0b0f14] text-white">

      {/* SIDEBAR — stays fixed while content scrolls */}
      <div className="h-screen shrink-0">
        <Sidebar onMenuChange={handleNavigation} />
      </div>

      {/* MAIN CONTENT — independently scrollable */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto p-6">

        {/* HOME / DASHBOARD */}
        {activePage === "Home" && (
          <>
            <h1 className="text-3xl font-bold tracking-wide mb-6">
              PPE Monitoring Dashboard
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <div className="lg:col-span-2 space-y-6">
                <VideoPanel />

                {/* <FactoryScene /> */}

                <EventLog />
              </div>

              <div className="space-y-6">
                <LatestAlert />
              </div>

            </div>
          </>
        )}

        {/* ANALYTICS */}
        {activePage === "Analytics" && (
          <>
            <h1 className="text-3xl font-bold tracking-wide mb-6">
              Safety Analytics
            </h1>

            <Analytics />
          </>
        )}

        {/* REPORTS */}
        {activePage === "Reports" && <Reports />}

        {/* ADD CAMERA */}
        {activePage === "Add Camera" && (
          <CameraManager mode="add" />
        )}

        {/* CAMERA MONITORING */}
        {isCameraPage && (
          <CameraManager
            mode="monitor"
            selectedCameraId={selectedCameraId}
          />
        )}

        {/* SETTINGS */}
        {activePage === "Settings" && <Settings />}

      </main>
    </div>
  );
}