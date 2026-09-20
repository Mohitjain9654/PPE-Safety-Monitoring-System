import { useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:8001";

const severityStyles = {
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/10 text-green-400 border-green-500/30",
};

const formatDate = (timestamp) => {
  if (!timestamp) return "—";

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) return timestamp;

  return date.toLocaleString();
};

const getSeverity = (severity) =>
  String(severity || "Unknown").toLowerCase();

const Reports = () => {
  const [events, setEvents] = useState([]);
  const [cameras, setCameras] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cameraFilter, setCameraFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  // Fetch actual backend data
  const fetchReports = async () => {
    try {
      setError("");

      const [eventsResponse, camerasResponse] = await Promise.all([
        fetch(`${API}/events`),
        fetch(`${API}/cameras`),
      ]);

      if (!eventsResponse.ok || !camerasResponse.ok) {
        throw new Error("Failed to fetch report data.");
      }

      const eventsData = await eventsResponse.json();
      const camerasData = await camerasResponse.json();

      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setCameras(Array.isArray(camerasData) ? camerasData : []);
    } catch (err) {
      setError(
        "Unable to connect to backend. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

    const interval = setInterval(fetchReports, 10000);

    return () => clearInterval(interval);
  }, []);

  // Camera ID -> Camera Name
  const cameraMap = useMemo(() => {
    const map = {};

    cameras.forEach((camera) => {
      map[camera.camera_id] = camera.name;
    });

    return map;
  }, [cameras]);

  const getCameraName = (cameraId) => {
    return cameraMap[cameraId] || cameraId || "Unknown Camera";
  };

  // Apply filters
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const severity = getSeverity(event.severity);

      const eventDate = event.timestamp
        ? event.timestamp.substring(0, 10)
        : "";

      const matchesCamera =
        cameraFilter === "All" ||
        event.camera_id === cameraFilter;

      const matchesSeverity =
        severityFilter === "All" ||
        severity === severityFilter.toLowerCase();

      const matchesStart =
        !startDate || eventDate >= startDate;

      const matchesEnd =
        !endDate || eventDate <= endDate;

      const searchText = [
        event.message,
        event.zone,
        ...(event.violations || []),
        getCameraName(event.camera_id),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(
        search.toLowerCase()
      );

      return (
        matchesCamera &&
        matchesSeverity &&
        matchesStart &&
        matchesEnd &&
        matchesSearch
      );
    });
  }, [
    events,
    cameraFilter,
    severityFilter,
    startDate,
    endDate,
    search,
    cameraMap,
  ]);

  // Stats based on filtered results
  const stats = useMemo(() => {
    const critical = filteredEvents.filter(
      (event) => getSeverity(event.severity) === "critical"
    ).length;

    const high = filteredEvents.filter(
      (event) => getSeverity(event.severity) === "high"
    ).length;

    const cameraCount = new Set(
      filteredEvents.map((event) => event.camera_id)
    ).size;

    return [
      {
        label: "Total Events",
        value: filteredEvents.length,
        color: "text-blue-400",
        icon: "📋",
      },
      {
        label: "Critical Alerts",
        value: critical,
        color: "text-red-400",
        icon: "🚨",
      },
      {
        label: "High Severity",
        value: high,
        color: "text-orange-400",
        icon: "⚠️",
      },
      {
        label: "Cameras Reporting",
        value: cameraCount,
        color: "text-green-400",
        icon: "📹",
      },
    ];
  }, [filteredEvents]);

  // CSV Export
  const exportCSV = () => {
    if (!filteredEvents.length) return;

    const headers = [
      "Event ID",
      "Timestamp",
      "Camera",
      "Zone",
      "Severity",
      "Violations",
      "Confidence",
      "Message",
    ];

    const rows = filteredEvents.map((event) => [
      event.id,
      event.timestamp,
      getCameraName(event.camera_id),
      event.zone,
      event.severity,
      (event.violations || []).join("; "),
      `${(Number(event.confidence) * 100).toFixed(1)}%`,
      event.message,
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "SafetyOps_PPE_Report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setCameraFilter("All");
    setSeverityFilter("All");
    setStartDate("");
    setEndDate("");
    setSearch("");
  };

  return (
    <div className="text-white space-y-6">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-wide">
            Safety Reports
          </h1>

          <p className="text-gray-400 mt-2">
            Monitor, filter and export PPE safety incidents.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchReports}
            className="px-4 py-2.5 rounded-lg border border-gray-700 bg-[#0f1720] hover:bg-gray-800 transition"
          >
            ↻ Refresh
          </button>

          <button
            onClick={exportCSV}
            disabled={!filteredEvents.length}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition"
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* DATA NOTICE */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg px-4 py-3 text-sm text-blue-300">
        Showing the latest {events.length} events available from the backend.
        Data refreshes automatically every 10 seconds.
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#0f1720] border border-gray-800 rounded-xl p-5"
          >
            <div className="flex justify-between items-center">
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <span className="text-xl">{stat.icon}</span>
            </div>

            <h2 className={`text-3xl font-bold mt-4 ${stat.color}`}>
              {loading ? "—" : stat.value}
            </h2>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="bg-[#0f1720] border border-gray-800 rounded-xl p-5">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-lg font-semibold">Filter Reports</h2>
            <p className="text-sm text-gray-500 mt-1">
              Narrow down events by date, camera or severity.
            </p>
          </div>

          <button
            onClick={resetFilters}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">

          {/* SEARCH */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full bg-[#080d13] border border-gray-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* START DATE */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              From Date
            </label>

            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#080d13] border border-gray-700 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          {/* END DATE */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              To Date
            </label>

            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#080d13] border border-gray-700 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          {/* CAMERA */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Camera
            </label>

            <select
              value={cameraFilter}
              onChange={(e) => setCameraFilter(e.target.value)}
              className="w-full bg-[#080d13] border border-gray-700 rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="All">All Cameras</option>

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

          {/* SEVERITY */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Severity
            </label>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-[#080d13] border border-gray-700 rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

        </div>
      </div>

      {/* REPORT TABLE */}
      <div className="bg-[#0f1720] border border-gray-800 rounded-xl overflow-hidden">

        <div className="p-5 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">
              Event History
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              PPE detection and safety violation records
            </p>
          </div>

          <span className="text-sm text-gray-400">
            {filteredEvents.length} records
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            Loading reports...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">

              <thead className="bg-[#111c28] text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">Event</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Camera</th>
                  <th className="p-4">Zone</th>
                  <th className="p-4">Violation</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Confidence</th>
                </tr>
              </thead>

              <tbody>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => {
                    const severity = getSeverity(event.severity);

                    return (
                      <tr
                        key={event.id}
                        className="border-t border-gray-800 hover:bg-[#111c28] transition"
                      >
                        <td className="p-4 text-gray-500 text-sm">
                          #{event.id}
                        </td>

                        <td className="p-4 text-sm text-gray-300 whitespace-nowrap">
                          {formatDate(event.timestamp)}
                        </td>

                        <td className="p-4 text-sm whitespace-nowrap">
                          {getCameraName(event.camera_id)}
                        </td>

                        <td className="p-4 text-sm text-gray-300">
                          {event.zone || "—"}
                        </td>

                        <td className="p-4 text-sm min-w-[180px]">
                          <div className="flex flex-wrap gap-1.5">
                            {(event.violations || []).length > 0 ? (
                              event.violations.map((violation, index) => (
                                <span
                                  key={`${event.id}-${index}`}
                                  className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs"
                                >
                                  {violation}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500">
                                {event.message || "No details"}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs border capitalize ${
                              severityStyles[severity] ||
                              "bg-gray-800 text-gray-400 border-gray-700"
                            }`}
                          >
                            {event.severity || "Unknown"}
                          </span>
                        </td>

                        <td className="p-4 text-sm text-gray-300 whitespace-nowrap">
                          {event.confidence != null
                            ? `${(Number(event.confidence) * 100).toFixed(1)}%`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-12 text-center text-gray-500"
                    >
                      No events found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;