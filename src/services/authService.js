import api from '../api/axiosConfig';

const USER_STORAGE_KEY = 'e-presence.user';
const TOKEN_STORAGE_KEY = 'e-presence.token';

function normalizeRole(role) {
  const value = String(role ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');

  if (!value) {
    return 'AGENT';
  }

  if (value === 'CHEF' || value === 'CHEF_DE_SERVICE' || value === 'CHEF_SERVICE') {
    return 'CHEF_SERVICE';
  }

  if (value === 'ADMINISTRATEUR') {
    return 'ADMIN';
  }

  return value;
}

function readApiMessage(data, fallback = '') {
  if (typeof data === 'string') {
    return data.trim() || fallback;
  }

  if (data && typeof data === 'object') {
    return String(data.message ?? data.error ?? data.detail ?? fallback).trim() || fallback;
  }

  return fallback;
}

function readOptionalBoolean(payload, keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      return Boolean(payload[key]);
    }
  }

  return undefined;
}

function getRoleKey(role) {
  return normalizeRole(role).toLowerCase();
}

function getDashboardPath(role) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'ADMIN') {
    return '/admin/dashboard';
  }

  if (normalizedRole === 'CHEF_SERVICE') {
    return '/chefservice/dashboard';
  }

  return '/agent/dashboard';
}

function buildSession(payload = {}) {
  const role = normalizeRole(payload.role);
  const visageEnregistre = readOptionalBoolean(payload, ['visageEnregistre', 'visage_enregistre']);

  return {
    token: payload.token ?? '',
    role,
    roleKey: getRoleKey(role),
    nom: payload.nom ?? '',
    prenom: payload.prenom ?? '',
    email: payload.email ?? '',
    visageEnregistre,
    photoVisage: payload.photoVisage ?? payload.photo_visage ?? '',
    photoProfil: payload.photoProfil ?? payload.photo_profil ?? '',
  };
}

function hasAuthPayload(payload) {
  return Boolean(payload && typeof payload === 'object' && payload.token && payload.role);
}

function getStoredSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawUser = window.localStorage.getItem(USER_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

function storeSession(session) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session));
  window.localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
}

function clearStoredSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function login(credentials) {
  const payload = {
    email: credentials.email,
    motDePasse: credentials.motDePasse ?? credentials.password,
  };

  try {
    const response = await api.post('/api/auth/login', payload);
    const data = response?.data;
    const message = readApiMessage(data, 'Connexion réussie');

    if (hasAuthPayload(data)) {
      const session = buildSession(data);
      storeSession(session);
      return {
        kind: 'authenticated',
        message,
        session,
      };
    }

    return {
      kind: 'message',
      message,
      status: response?.status,
    };
  } catch (error) {
    const message = readApiMessage(
      error?.response?.data,
      'Connexion impossible. Vérifie le backend Spring Boot et l’URL API.'
    );

    throw new Error(message);
  }
}

async function registerAgent(payload) {
  const body = {
    nom: payload.nom,
    prenom: payload.prenom,
    email: payload.email,
    telephone: payload.telephone,
    motDePasse: payload.motDePasse,
    serviceId: payload.serviceId,
  };


  try {
    const response = await api.post('/api/auth/register', body);
    const message = readApiMessage(response?.data, 'Compte créé. En attente de validation admin.');
    return {
      message,
      status: response?.status,
    };
  } catch (error) {
    const message = readApiMessage(
      error?.response?.data,
      'Impossible de créer le compte. Vérifie le backend Spring Boot et l’URL API.'
    );

    throw new Error(message);
  }
}
async function fetchServices() {
  try {
    const response = await api.get('/api/services');
    return response.data;
  } catch {
    return [];
  }
}

export {
  clearStoredSession,
  getDashboardPath,
  getRoleKey,
  getStoredSession,
  login,
  normalizeRole,
  registerAgent,
  fetchServices,
};
