import api from '../api/axiosConfig';

const GPS_CONFIG_ENDPOINT = '/api/gps/config';

export async function getGpsConfig() {
  try {
    const response = await api.get(GPS_CONFIG_ENDPOINT);
    return response?.data || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la config GPS:', error);
    return null;
  }
}

export async function getLieuByName(nom) {
  try {
    const response = await api.get(`/api/lieux/by-name/${encodeURIComponent(nom)}`);
    return response?.data || null;
  } catch (error) {
    console.error('Erreur lors de la récupération du lieu:', error);
    return null;
  }
}

export async function updateGpsConfig(updates) {
  try {
    const response = await api.patch(GPS_CONFIG_ENDPOINT, updates);
    return {
      success: true,
      data: response?.data,
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la config GPS:', error);
    return {
      success: false,
      error: error?.response?.data?.message || 'Impossible de mettre à jour la configuration GPS',
    };
  }
}
