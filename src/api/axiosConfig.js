import axios from 'axios';

const AUTH_UNAUTHORIZED_EVENT = 'e-presence:auth-unauthorized';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('e-presence.token');

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers && config.headers.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export function emitAuthUnauthorized() {
  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
}

export { AUTH_UNAUTHORIZED_EVENT };
export default api;
