import api from '../api/axiosConfig';

function readApiMessage(data, fallback = '') {
  if (typeof data === 'string') {
    return data.trim() || fallback;
  }

  if (data && typeof data === 'object') {
    return String(data.message ?? data.error ?? data.detail ?? fallback).trim() || fallback;
  }

  return fallback;
}

function normalizeList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return [];
}

async function marquerPresence(payload) {
  try {
    const response = await api.post('/api/presences/pointage', payload);

    return {
      message: readApiMessage(response?.data, 'Présence marquée avec succès'),
      status: response?.status,
    };
  } catch (error) {
    const status = error?.response?.status;
    const fallback =
      status === 400
        ? "Vous avez déjà pointé aujourd'hui."
        : status === 403
          ? 'Pointage refusé par le backend.'
          : 'Impossible de marquer la présence. Vérifie ta connexion.';

    throw new Error(readApiMessage(error?.response?.data, fallback));
  }
}

async function fetchMesPresences() {
  const response = await api.get('/api/presences/mes-presences');

  return {
    presences: normalizeList(response?.data),
    message: readApiMessage(response?.data, 'Historique chargé'),
    status: response?.status,
  };
}

export {
  fetchMesPresences,
  marquerPresence,
};
