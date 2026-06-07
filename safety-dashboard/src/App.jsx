import Sidebar from "./components/Sidebar";
import VideoPanel from "./components/VideoPanel";
import EventLog from "./components/EventLog";
import LatestAlert from "./components/LatestAlert";
import Analytics from "./components/Analytics";
import SpatialView from "./components/SpatialView";

export default function App() {
  return (
    <div className="flex bg-[#0b0f14] min-h-screen text-white">

      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="flex-1 p-6 space-y-6">

        <h1 className="text-3xl font-bold tracking-wide">
          PPE Monitoring Dashboard
        </h1>

        <div className="grid grid-cols-3 gap-6">

          {/* Left */}
          <div className="col-span-2 space-y-6">
            {/* <div className="grid grid-cols-2 gap-6"> */}
              <VideoPanel />
              <SpatialView />
            {/* </div> */}
            {/* <VideoPanel />
            <SpatialView /> */}
            <EventLog />
          </div>

          {/* Right */}
          <div className="space-y-6">
            <LatestAlert />
            <Analytics />
          </div>

        </div>
      </div>
    </div>
  );
}