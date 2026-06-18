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

async function fetchDemandesComptes() {
  const response = await api.get('/api/admin/demandes-comptes');

  return {
    demandes: normalizeList(response?.data),
    message: readApiMessage(response?.data, 'Demandes chargées'),
    status: response?.status,
  };
}

async function traiterDemandeCompte({ utilisateurId, accepter }) {
  const response = await api.post('/api/admin/traiter-demande', {
    utilisateurId,
    accepter,
  });

  return {
    message: readApiMessage(
      response?.data,
      accepter ? 'Compte validé avec succès' : 'Compte refusé et supprimé'
    ),
    status: response?.status,
  };
}

async function creerChefService(payload) {
  const body = {
    nom: payload.nom,
    prenom: payload.prenom,
    email: payload.email,
    telephone: payload.telephone,
    motDePasse: payload.motDePasse,
  };

  const response = await api.post('/api/admin/creer-chef-service', body);

  return {
    message: readApiMessage(response?.data, 'Chef service créé avec succès'),
    status: response?.status,
  };
}

async function fetchStatistiquesGlobales() {
  const response = await api.get('/api/admin/statistiques-globales');

  return response.data;
}

export {
  creerChefService,
  fetchDemandesComptes,
  fetchStatistiquesGlobales,
  traiterDemandeCompte,
};
