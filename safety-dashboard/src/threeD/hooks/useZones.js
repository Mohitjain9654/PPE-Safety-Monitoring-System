import { useEffect, useState } from "react";
import { fetchZones } from "../services/zoneService";

export default function useZones() {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    const loadZones = async () => {
      try {
        const data = await fetchZones();
        setZones(data);
      } catch (err) {
        console.error(err);
      }
    };

    // Initial load
    loadZones();

    // Refresh every 1 second
    const interval = setInterval(
      loadZones,
      1000
    );

    return () =>
      clearInterval(interval);

  }, []);

  return zones;
}