import { useEffect, useState } from "react";

export default function EventLog() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchData = () => {
      fetch("http://127.0.0.1:8001/events")
        .then(res => res.json())
        .then(data => setEvents(data));
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 p-4 rounded h-[250px] overflow-y-auto">
      <h2 className="text-green-400 mb-2">Event Log</h2>

      {events.map((e, i) => (
        <div key={i} className="text-sm border-b border-gray-700 py-2">
          <p>{e.message}</p>
          <p className="text-gray-400 text-xs">{e.timestamp}</p>
        </div>
      ))}
    </div>
  );
}