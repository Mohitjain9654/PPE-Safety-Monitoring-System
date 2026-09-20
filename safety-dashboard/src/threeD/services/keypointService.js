const API = "http://localhost:8001";

export async function fetchKeypoints() {
  const res = await fetch(`${API}/keypoints`);

  if (!res.ok) {
    throw new Error("Failed to fetch keypoints");
  }

  return await res.json();
}