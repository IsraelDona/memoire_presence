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

async function fetchEquipePresences() {
  const response = await api.get('/api/chef-service/presences-agents');

  return {
    presences: normalizeList(response?.data),
    message: readApiMessage(response?.data, 'Présences de l’équipe chargées'),
    status: response?.status,
  };
}

async function fetchJustificatifsChef() {
  const response = await api.get('/api/chef-service/justificatifs');

  return {
    justificatifs: normalizeList(response?.data),
    message: readApiMessage(response?.data, 'Justificatifs chargés'),
    status: response?.status,
  };
}

export {
  fetchEquipePresences,
  fetchJustificatifsChef,
};
