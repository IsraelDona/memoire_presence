import api from '../api/axiosConfig';

export async function fetchNotifications() {
  const response = await api.get(
    '/api/notifications/mes'
  );

  return response.data;
}

export async function marquerCommeLue(id) {
  const response = await api.put(
    `/api/notifications/${id}/lire`
  );

  return response.data;
}