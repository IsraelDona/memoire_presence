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

  if (Array.isArray(data?.justificatifs)) {
    return data.justificatifs;
  }

  if (Array.isArray(data?.demandes)) {
    return data.demandes;
  }

  return [];
}

const AGENT_JUSTIFICATIFS_LIST_ENDPOINT =
  process.env.REACT_APP_AGENT_JUSTIFICATIFS_LIST_ENDPOINT || '/api/agent/justificatifs';

const AGENT_JUSTIFICATIFS_CREATE_ENDPOINT =
  process.env.REACT_APP_AGENT_JUSTIFICATIFS_CREATE_ENDPOINT || '/api/agent/justificatifs';

async function fetchMesJustificatifs() {
  const response = await api.get(AGENT_JUSTIFICATIFS_LIST_ENDPOINT);

  return {
    justificatifs: normalizeList(response?.data),
    message: readApiMessage(response?.data, 'Demandes chargées'),
    status: response?.status,
  };
}

async function submitJustificatif(payload) {
  const response = await api.post(AGENT_JUSTIFICATIFS_CREATE_ENDPOINT, payload);

  return {
    message: readApiMessage(response?.data, 'Demande transmise avec succès'),
    status: response?.status,
    data: response?.data,
  };
}

export {
  fetchMesJustificatifs,
  submitJustificatif,
};
