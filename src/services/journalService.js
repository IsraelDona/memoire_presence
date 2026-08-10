import api from "../api/axiosConfig";

export async function fetchJournaux() {
  const response = await api.get("/journaux");

  return response.data;
}