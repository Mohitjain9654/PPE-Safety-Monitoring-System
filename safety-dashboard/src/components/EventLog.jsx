import { useEffect, useState } from "react";

export default function EventLog() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "http://127.0.0.1:8001/events"
        );

        const data = await res.json();

        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };

    // Initial fetch
    fetchData();

    // Refresh every 2 seconds
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityStyle = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return {
          badge: "bg-red-500/10 text-red-400 border-red-500/20",
          dot: "bg-red-400",
        };

      case "medium":
        return {
          badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
          dot: "bg-yellow-400",
        };

      case "low":
        return {
          badge: "bg-green-500/10 text-green-400 border-green-500/20",
          dot: "bg-green-400",
        };

      default:
        return {
          badge: "bg-gray-500/10 text-gray-400 border-gray-500/20",
          dot: "bg-gray-400",
        };
    }
  };

  return (
    <div className="bg-[#0f1720] rounded-xl border border-gray-800 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">

        <div>
          <p className="text-green-400 text-xs font-medium tracking-wider">
            MONITORING
          </p>

          <h2 className="text-lg font-semibold text-white">
            Event Log
          </h2>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 text-xs text-green-400">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Live
        </div>

      </div>

      {/* Events */}
      <div className="h-[300px] overflow-y-auto">

        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 text-sm">
              No safety events detected
            </p>
          </div>
        ) : (

          <div className="divide-y divide-gray-800">

            {events.map((event) => {

              const severity = getSeverityStyle(
                event.severity
              );

              return (
                <div
                  key={event.id}
                  className="px-5 py-4 hover:bg-[#111827] transition-colors"
                >

                  <div className="flex gap-3">

                    {/* Status dot */}
                    <div className="pt-1.5">
                      <span
                        className={`block w-2 h-2 rounded-full ${severity.dot}`}
                      />
                    </div>

                    {/* Event content */}
                    <div className="flex-1 min-w-0">

                      {/* Top row */}
                      <div className="flex items-center justify-between gap-3">

                        <p className="text-sm font-medium text-white truncate">
                          {event.message}
                        </p>

                        <span
                          className={`text-[10px] uppercase px-2 py-1 rounded border ${severity.badge}`}
                        >
                          {event.severity || "Unknown"}
                        </span>

                      </div>

                      {/* Details */}
                      <div className="flex items-center gap-3 mt-2">

                        <span className="text-xs text-gray-500">
                          {event.timestamp}
                        </span>

                        {event.zone && (
                          <>
                            <span className="text-gray-700">
                              •
                            </span>

                            <span className="text-xs text-gray-500">
                              {event.zone}
                            </span>
                          </>
                        )}

                      </div>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

    </div>
  );
}

// import { useEffect, useState } from "react";

// export default function EventLog() {
//   const [events, setEvents] = useState([]);

//   useEffect(() => {
//     const fetchData = () => {
//       fetch("http://127.0.0.1:8001/events")
//         .then(res => res.json())
//         .then(data => setEvents(data));
//     };

//     fetchData();
//     const interval = setInterval(fetchData, 2000);

//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div className="bg-gray-900 p-4 rounded h-[250px] overflow-y-auto">
//       <h2 className="text-green-400 mb-2">Event Log</h2>

//       {events.map((e, i) => (
//         <div key={i} className="text-sm border-b border-gray-700 py-2">
//           <p>{e.message}</p>
//           <p className="text-gray-400 text-xs">{e.timestamp}</p>
//         </div>
//       ))}
//     </div>
//   );
// }