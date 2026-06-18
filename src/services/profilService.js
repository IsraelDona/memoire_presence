import api from '../api/axiosConfig'

export async function getMonProfil() {
  const response = await api.get('/api/profil');
  return response.data;
}

export async function updateMonProfil(data) {
  const response = await api.patch('/api/profil', data);
  return response.data;
}

export async function updatePhotoProfil(photoProfil) {
  const response = await api.patch(
    '/api/profil/photo',
    {
      photoProfil,
    }
  );

  return response.data;
}