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
  const data = response.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.content)) return data.content;

  return [];
}

export async function consulterRapportPdfHistorique(id) {
  const openedWindow = window.open("", "_blank");
  const response = await api.get(`/api/admin/rapports-pdf/telecharger/${id}`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));

  if (openedWindow) {
    openedWindow.location.href = url;
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}

export async function supprimerRapportPdf(id) {
  await api.delete(`/api/admin/rapports-pdf/${id}`);
}

export async function supprimerTousRapportsPdf() {
  await api.delete("/api/admin/rapports-pdf/tout");
}
