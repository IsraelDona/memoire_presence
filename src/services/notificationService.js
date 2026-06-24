import api from '../api/axiosConfig';

export async function fetchNotifications() {
  const response = await api.get(
    '/api/notifications/mes'
  );

  return response.data;
}

export async function fetchNotificationsCount() {
  const response = await api.get(
    '/api/notifications/mes/count'
  );

  return response.data;
}

export async function marquerCommeLue(id) {
  const response = await api.put(
    `/api/notifications/${id}/lire`
  );

  return response.data;
}

export async function supprimerToutesNotifications() {
  const response = await api.delete(
    '/api/notifications/mes'
  );

  return response.data;
}
export async function supprimerNotification(id) {
  const response = await api.delete(
    `/api/notifications/${id}`
  );

  return response.data;
}