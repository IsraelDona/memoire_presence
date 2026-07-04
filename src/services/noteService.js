import api from "../api/axiosConfig";

// CHEF — calculer note auto d'un agent
export async function calculerNoteAutoChef(agentId, mois, annee) {
  const response = await api.post(
    `/api/notes/chef/calculer/${agentId}`,
    null,
    { params: { mois, annee } }
  );
  return response.data;
}
// CHEF — noter un agent
export async function noterAgent(agentId, mois, annee, note) {
  const response = await api.post(`/api/notes/chef/noter/${agentId}`, {
    mois,
    annee,
    note,
  });
  return response.data;
}

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