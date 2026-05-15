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

  return {
    token: payload.token ?? '',
    role,
    roleKey: getRoleKey(role),
    name: payload.nom ?? payload.name ?? '',
    email: payload.email ?? '',
  };
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

  const { data } = await api.post('/api/auth/login', payload);
  const session = buildSession(data);
  storeSession(session);
  return session;
}

async function registerAgent(payload) {
  const body = {
    nom: payload.nom,
    prenom: payload.prenom,
    email: payload.email,
    telephone: payload.telephone,
    motDePasse: payload.motDePasse,
  };

  const { data } = await api.post('/api/auth/register', body);
  return data;
}

export {
  clearStoredSession,
  getDashboardPath,
  getRoleKey,
  getStoredSession,
  login,
  normalizeRole,
  registerAgent,
};
