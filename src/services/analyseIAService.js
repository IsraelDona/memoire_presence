import api from '../api/axiosConfig';

export async function genererAnalyseIA() {
  const response = await api.post('/api/analyse-ia/me/generer');

  return response.data;
}

export async function fetchMesAnalysesIA() {
  const response = await api.get('/api/analyse-ia/me');

  return response.data;
}


