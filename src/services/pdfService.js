import api from "../api/axiosConfig";

export async function telechargerRapportPdf() {

  const response = await api.get(
    "/api/admin/pdf/rapport",
    {
      responseType: "blob"
    }
  );

  const url = window.URL.createObjectURL(
    new Blob([response.data])
  );

  const link = document.createElement("a");

  link.href = url;

  link.setAttribute(
    "download",
    "rapport_dgb.pdf"
  );

  document.body.appendChild(link);

  link.click();

  link.remove();
}