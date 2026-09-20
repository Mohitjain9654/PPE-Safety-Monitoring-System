import { useEffect, useState } from "react";
import { useWorkerStore } from "../hooks/useWorkers";

export default function AlertOverlay() {
  const workers   = useWorkerStore((s) => s.workers);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const newAlerts = [];

    workers.forEach((w) => {
      if (!w.violations?.length) return;

      w.violations.forEach((v) => {
        const isZone = v === "restricted_zone_breach";
        newAlerts.push({
          id:      `${w.id}-${v}`,
          workerId: w.id,
          type:    isZone ? "zone" : "ppe",
          label:   isZone
            ? `Area Breach — ID ${w.id}`
            : `${v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} — ID ${w.id}`,
          color:   isZone ? "#ef4444" : "#f97316",
        });
      });
    });

    setAlerts(newAlerts.slice(0, 3)); // max 3 alerts visible
  }, [workers]);

  if (!alerts.length) return null;

  return (
    <div className="absolute bottom-3 right-3 flex flex-col gap-2 max-w-[240px]">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start gap-2 px-3 py-2 rounded text-xs font-bold shadow-lg"
          style={{
            background: `${alert.color}22`,
            border: `1px solid ${alert.color}`,
            color: alert.color,
          }}
        >
          <span className="text-sm mt-0.5">⚠</span>
          <div>
            <div className="uppercase tracking-wide" style={{ fontSize: "10px", opacity: 0.7 }}>
              {alert.type === "zone" ? "ALERT: Area Breach" : "ALERT: PPE Violation"}
            </div>
            <div>{alert.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}