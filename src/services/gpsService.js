import api from '../api/axiosConfig';

export async function reverseGeocode(latitude, longitude) {
  const response = await api.get(
    `/api/geocoding/reverse?latitude=${latitude}&longitude=${longitude}`
  );
  return response.data;
}