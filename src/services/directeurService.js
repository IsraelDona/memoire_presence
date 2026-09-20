import api from '../api/axiosConfig';

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

/**
 * Récupérer la liste des chefs de service.
 */
async function getChefsService() {
  const response = await api.get('/api/directeur/chefs');
  return normalizeList(response.data);
}

export {
  getChefsService,
};