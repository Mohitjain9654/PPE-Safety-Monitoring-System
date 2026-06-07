import { useEffect, useState } from "react";

export default function LatestAlert() {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const fetchData = () => {
      fetch("http://127.0.0.1:8001/latest")
        .then(res => res.json())
        .then(data => setAlert(data));
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!alert) return null;

  return (
    <div className="bg-red-900/30 p-4 rounded">
      <h2 className="text-red-400">Latest Alert</h2>
      <p>{alert.message}</p>
    </div>
  );
}