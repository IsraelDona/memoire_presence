import api from "../api/axiosConfig";

export async function fetchJournaux() {
  const response = await api.get("/api/admin/journaux");

  return response.data;
}