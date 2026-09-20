import { useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:8001";

const violationNames = {
  no_helmet: "No Helmet",
  no_vest: "No Vest",
  no_gloves: "No Gloves",
  no_boots: "No Boots",
  restricted_zone_breach: "Restricted Zone Breach",
};

export default function Analytics() {
  const [cameras, setCameras] = useState([]);
  const [overallStats, setOverallStats] = useState({});
  const [cameraStats, setCameraStats] = useState({});
  const [cameraViolationStats, setCameraViolationStats] = useState({});

  const [selectedCamera, setSelectedCamera] = useState("all");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [backendError, setBackendError] = useState(false);

  // =====================================================
  // FETCH ANALYTICS DATA
  // =====================================================

  const fetchAnalytics = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const [
        camerasResponse,
        overallResponse,
        cameraResponse,
        cameraViolationResponse,
      ] = await Promise.all([
        fetch(`${API}/cameras`, { signal: controller.signal }),
        fetch(`${API}/analytics/violations`, {
          signal: controller.signal,
        }),
        fetch(`${API}/analytics/cameras`, {
          signal: controller.signal,
        }),
        fetch(`${API}/analytics/cameras/violations`, {
          signal: controller.signal,
        }),
      ]);

      if (
        !camerasResponse.ok ||
        !overallResponse.ok ||
        !cameraResponse.ok ||
        !cameraViolationResponse.ok
      ) {
        throw new Error("Failed to fetch analytics");
      }

      const [
        camerasData,
        overallData,
        cameraData,
        cameraViolationData,
      ] = await Promise.all([
        camerasResponse.json(),
        overallResponse.json(),
        cameraResponse.json(),
        cameraViolationResponse.json(),
      ]);

      setCameras(camerasData);
      setOverallStats(overallData);
      setCameraStats(cameraData);
      setCameraViolationStats(cameraViolationData);

      setLastUpdated(new Date());
      setBackendError(false);
    } catch (error) {
      console.error("Analytics fetch error:", error);
      setBackendError(true);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // =====================================================
  // AUTO REFRESH — EVERY 2 SECONDS
  // =====================================================

  useEffect(() => {
    let isMounted = true;
    let isFetching = false;
    let timeoutId;

    const updateAnalytics = async () => {
      if (!isMounted || isFetching) return;

      isFetching = true;

      try {
        await fetchAnalytics();
      } finally {
        isFetching = false;

        if (isMounted) {
          timeoutId = setTimeout(updateAnalytics, 2000);
        }
      }
    };

    updateAnalytics();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // =====================================================
  // CURRENT CAMERA STATS
  // =====================================================

  const currentStats = useMemo(() => {
    if (selectedCamera === "all") {
      return overallStats;
    }

    return cameraViolationStats[selectedCamera] || {};
  }, [selectedCamera, overallStats, cameraViolationStats]);

  // =====================================================
  // TOTAL VIOLATIONS
  // =====================================================

  const totalViolations = Object.values(currentStats).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  // =====================================================
  // MOST COMMON VIOLATION
  // =====================================================

  const mostCommonViolation = Object.entries(currentStats)
    .sort(([, a], [, b]) => Number(b) - Number(a))[0];

  // =====================================================
  // SAFEST CAMERA
  // =====================================================

  const safestCamera = useMemo(() => {
    if (!cameras.length) return null;

    return [...cameras].sort(
      (a, b) =>
        Number(cameraStats[a.camera_id] || 0) -
        Number(cameraStats[b.camera_id] || 0)
    )[0];
  }, [cameras, cameraStats]);

  // =====================================================
  // HIGHEST VIOLATION CAMERA
  // =====================================================

  const highestViolationCamera = useMemo(() => {
    if (!cameras.length) return null;

    return [...cameras].sort(
      (a, b) =>
        Number(cameraStats[b.camera_id] || 0) -
        Number(cameraStats[a.camera_id] || 0)
    )[0];
  }, [cameras, cameraStats]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="bg-[#0f1720] border border-gray-800 rounded-xl p-8">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />

          <p className="text-gray-400">
            Loading safety analytics...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-green-400 text-xs font-semibold tracking-wider">
            SAFETY ANALYTICS
          </p>

          <h2 className="text-2xl font-bold text-white mt-1">
            Safety Performance
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Real-time PPE violation analysis
          </p>
        </div>

        {/* CAMERA FILTER */}

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            ANALYZE CAMERA
          </label>

          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="bg-[#111827] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 min-w-[200px] focus:outline-none focus:border-green-500"
          >
            <option value="all">All Cameras</option>

            {cameras.map((camera) => (
              <option
                key={camera.camera_id}
                value={camera.camera_id}
              >
                {camera.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* BACKEND STATUS */}

      {backendError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
          Unable to refresh analytics. Backend may be disconnected.
          Showing the last available data.
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="TOTAL VIOLATIONS"
          value={totalViolations}
          icon="⚠️"
        />

        <StatCard
          label="ACTIVE CAMERAS"
          value={cameras.length}
          icon="📹"
        />

        <StatCard
          label="MOST COMMON"
          value={
            mostCommonViolation
              ? formatViolation(mostCommonViolation[0])
              : "No Data"
          }
          icon="📊"
        />

        <StatCard
          label="SAFEST CAMERA"
          value={safestCamera ? safestCamera.name : "No Data"}
          icon="🛡️"
        />
      </div>

      {/* VIOLATION DISTRIBUTION */}

      <div className="bg-[#0f1720] border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-green-400 font-semibold">
              VIOLATION ANALYSIS
            </p>

            <h3 className="text-lg font-semibold text-white mt-1">
              {selectedCamera === "all"
                ? "All Cameras"
                : getCameraName(selectedCamera, cameras)}
            </h3>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">TOTAL</p>

            <p className="text-2xl font-bold text-white">
              {totalViolations}
            </p>
          </div>
        </div>

        {totalViolations === 0 ? (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3 text-green-400">✓</div>

            <p className="text-gray-400">
              No violations recorded yet.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(currentStats)
              .sort(([, a], [, b]) => Number(b) - Number(a))
              .map(([violation, count]) => {
                const percentage =
                  totalViolations > 0
                    ? (Number(count) / totalViolations) * 100
                    : 0;

                return (
                  <ViolationBar
                    key={violation}
                    name={formatViolation(violation)}
                    count={count}
                    percentage={percentage}
                  />
                );
              })}
          </div>
        )}
      </div>

      {/* CAMERA COMPARISON */}

      <div className="bg-[#0f1720] border border-gray-800 rounded-xl p-6">
        <div className="mb-6">
          <p className="text-xs text-green-400 font-semibold">
            CAMERA PERFORMANCE
          </p>

          <h3 className="text-lg font-semibold text-white mt-1">
            Camera Violation Comparison
          </h3>
        </div>

        {cameras.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No cameras available.
          </p>
        ) : (
          <div className="space-y-4">
            {[...cameras]
              .sort(
                (a, b) =>
                  Number(cameraStats[b.camera_id] || 0) -
                  Number(cameraStats[a.camera_id] || 0)
              )
              .map((camera) => {
                const count = Number(
                  cameraStats[camera.camera_id] || 0
                );

                const max = Math.max(
                  ...cameras.map((item) =>
                    Number(cameraStats[item.camera_id] || 0)
                  ),
                  1
                );

                const percentage = (count / max) * 100;

                return (
                  <div key={camera.camera_id}>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">
                          {camera.name}
                        </span>

                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            camera.status === "online"
                              ? "bg-green-400"
                              : "bg-gray-600"
                          }`}
                        />
                      </div>

                      <span className="text-sm text-gray-400">
                        {count}
                      </span>
                    </div>

                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* INSIGHTS */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* HIGHEST VIOLATION */}

        <div className="bg-[#0f1720] border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500">
            HIGHEST VIOLATION CAMERA
          </p>

          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-lg font-semibold text-white">
                {highestViolationCamera
                  ? highestViolationCamera.name
                  : "No Data"}
              </p>

              <p className="text-sm text-gray-500 mt-1">
                {highestViolationCamera
                  ? `${
                      cameraStats[
                        highestViolationCamera.camera_id
                      ] || 0
                    } violations`
                  : ""}
              </p>
            </div>

            <div className="text-3xl">⚠️</div>
          </div>
        </div>

        {/* SAFEST CAMERA */}

        <div className="bg-[#0f1720] border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500">SAFEST CAMERA</p>

          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-lg font-semibold text-white">
                {safestCamera ? safestCamera.name : "No Data"}
              </p>

              <p className="text-sm text-gray-500 mt-1">
                {safestCamera
                  ? `${
                      cameraStats[safestCamera.camera_id] || 0
                    } violations`
                  : ""}
              </p>
            </div>

            <div className="text-3xl">🛡️</div>
          </div>
        </div>
      </div>

      {/* LAST UPDATED */}

      <div className="flex justify-between items-center">
        <p
          className={`text-xs ${
            backendError ? "text-red-400" : "text-green-500"
          }`}
        >
          {backendError ? "● Backend unavailable" : "● Live updates enabled"}
        </p>

        <p className="text-xs text-gray-500">
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString()}`
            : "Updating..."}
        </p>
      </div>
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-[#0f1720] border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{label}</p>

        <span className="text-lg">{icon}</span>
      </div>

      <p className="text-xl font-bold text-white mt-3 truncate">
        {value}
      </p>
    </div>
  );
}

// =====================================================
// VIOLATION BAR
// =====================================================

function ViolationBar({ name, count, percentage }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-300">{name}</span>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {percentage.toFixed(1)}%
          </span>

          <span className="text-sm text-white font-medium">
            {count}
          </span>
        </div>
      </div>

      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// =====================================================
// FORMAT VIOLATION NAME
// =====================================================

function formatViolation(name) {
  return (
    violationNames[name] ||
    name
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

// =====================================================
// CAMERA NAME
// =====================================================

function getCameraName(cameraId, cameras) {
  const camera = cameras.find(
    (item) => item.camera_id === cameraId
  );

  return camera ? camera.name : "Unknown Camera";
}