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


async function fetchChefMissions() {
  const response = await api.get('/api/chef-service/missions');

  return {
    missions: normalizeList(response?.data),
    message: readApiMessage(response?.data, 'Missions chargées'),
    status: response?.status,
  };
}

async function createChefMission(payload) {
  const response = await api.post('/api/chef-service/missions', payload);

  return {
    message: readApiMessage(response?.data, 'Mission créée avec succès'),
    status: response?.status,
  };
}

async function fetchChefReunions() {
  const response = await api.get('/api/chef-service/reunions');

  return {
    reunions: normalizeList(response?.data),
    message: readApiMessage(response?.data, 'Réunions chargées'),
    status: response?.status,
  };
}

async function createChefReunion(payload) {
  const response = await api.post('/api/chef-service/reunions', payload);

  return {
    message: readApiMessage(response?.data, 'Réunion créée avec succès'),
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


async function supprimerChefMission(missionId) {
  const response = await api.delete('/api/chef-service/missions/' + missionId);

  return {
    message: readApiMessage(response?.data, 'Mission supprimée'),
    status: response?.status,
  };
}

async function supprimerChefReunion(reunionId) {
  const response = await api.delete('/api/chef-service/reunions/' + reunionId);

  return {
    message: readApiMessage(response?.data, 'Réunion supprimée'),
    status: response?.status,
  };
}
export {
  createChefMission,
  createChefReunion,
  supprimerChefMission,
  supprimerChefReunion,
  fetchChefMissions,
  fetchChefReunions,
  fetchEquipePresences,
  fetchJustificatifsChef,
};
export async function fetchAgentsDuService() {
  const response = await api.get('/api/chef-service/agents');
  return response.data;
}
// Valider un justificatif (ACCEPTE)
export const validerJustificatif = (justificatifId) => {
  return api.put(`/api/agent/justificatifs/${justificatifId}/accepter`);
};

export const refuserJustificatif = (justificatifId, motifRefus = '') => {
  return api.put(`/api/agent/justificatifs/${justificatifId}/refuser`, { motifRefus });
};
