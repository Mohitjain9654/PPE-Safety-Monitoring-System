import { useEffect, useState } from "react";

export default function Analytics() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchData = () => {
      fetch("http://127.0.0.1:8001/stats")
        .then(res => res.json())
        .then(data => setStats(data));
    };

    fetchData();
  }, []);

  return (
    <div className="bg-gray-900 p-4 rounded">
      <h2 className="text-green-400">Analytics</h2>

      {Object.entries(stats).map(([k, v]) => (
        <p key={k}>{k}: {v}</p>
      ))}
    </div>
  );
}