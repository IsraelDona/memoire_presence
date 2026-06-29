import api from "../api/axiosConfig";

export async function telechargerRapportPdf() {
  const response = await api.get("/api/admin/pdf/rapport", {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;

  // Récupère le nom de fichier depuis le header si dispo
  const disposition = response.headers["content-disposition"];
  let nomFichier = "rapport_dgb.pdf";
  if (disposition && disposition.includes("filename=")) {
    nomFichier = disposition.split("filename=")[1].replace(/"/g, "").trim();
  }

  link.setAttribute("download", nomFichier);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function getHistoriquePdf() {
  const response = await api.get("/api/admin/rapports-pdf");
  return response.data;
}

export async function supprimerRapportPdf(id) {
  await api.delete(`/api/admin/rapports-pdf/${id}`);
}

export async function supprimerTousRapportsPdf() {
  await api.delete("/api/admin/rapports-pdf/tout");
}