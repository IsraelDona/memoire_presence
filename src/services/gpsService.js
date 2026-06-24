import api from '../api/axiosConfig';

export async function getZoneGps() {
  const response = await api.get('/api/admin/gps');
  return response.data;
}

export async function updateZoneGps(data) {
  const response = await api.patch('/api/admin/gps', data);
  return response.data;
}
export async function reverseGeocode(latitude, longitude) {
  const response = await api.get(
    `/api/geocoding/reverse?latitude=${latitude}&longitude=${longitude}`
  );
  return response.data;
}