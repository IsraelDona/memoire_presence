import api from "../api/axiosConfig";

// CHEF — classement de ses agents
export async function getClassementAgentsChef(mois, annee) {
  const response = await api.get("/api/notes/chef/classement", {
    params: { mois, annee },
  });
  return response.data;
}

// ADMIN — noter un chef
export async function noterChef(chefId, mois, annee, note) {
  const response = await api.post(`/api/notes/admin/noter/${chefId}`, {
    mois,
    annee,
    note,
  });
  return response.data;
}

// ADMIN — calculer la note auto d'un utilisateur
export async function calculerNoteAuto(userId, mois, annee) {
  const response = await api.post(
    `/api/notes/admin/calculer/${userId}`,
    null,
    { params: { mois, annee } }
  );
  return response.data;
}

// ADMIN — classement global des chefs
export async function getClassementChefs(mois, annee) {
  const response = await api.get("/api/notes/admin/classement-chefs", {
    params: { mois, annee },
  });
  return response.data;
}

// ADMIN — classement global des agents
export async function getClassementAgentsAdmin(mois, annee) {
  const response = await api.get("/api/notes/admin/classement-agents", {
    params: { mois, annee },
  });
  return response.data;
}

// AGENT/CHEF — mon historique de notes
export async function getMonHistoriqueNotes() {
  const response = await api.get("/api/notes/mon-historique");
  return response.data;
}

export async function calculerNoteChefDirecteur(chefId, mois, annee) {
  const response = await api.post(
    `/api/notes/directeur/calculer-chef/${chefId}`,
    null,
    {
      params: { mois, annee },
    }
  );

  return response.data;
}
// AGENT/CHEF — classement au sein de mon propre service
export async function getMonClassementService(mois, annee) {
  const response = await api.get("/api/notes/mon-classement-service", {
    params: { mois, annee },
  });
  return response.data;
}

// CHEF — classement de tous les chefs de service
export async function getClassementChefsPourChef(mois, annee) {
  const response = await api.get("/api/notes/classement-chefs", {
    params: { mois, annee },
  });
  return response.data;
}
