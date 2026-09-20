const API = "http://localhost:8001";

export async function fetchZones() {
  const response = await fetch(`${API}/zones`);

  if (!response.ok) {
    throw new Error("Failed to fetch zones");
  }

  return response.json();
}