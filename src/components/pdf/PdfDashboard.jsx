import  "../../styles/PdfDashboard.css";
import { telechargerRapportPdf } from "../../services/pdfService";

export default function PdfDashboard() {


  async function handlePdf() {

    try {

      await telechargerRapportPdf();

    } catch {

      alert("Erreur téléchargement PDF");
    }
  }

  return (

    <div className="pdf-card">

      <div className="pdf-left">

        <h2>Rapports PDF</h2>

        <p>
          Télécharger un rapport global de présence
          des agents de la DGB.
        </p>

      </div>

      <button
        className="pdf-btn"
        onClick={handlePdf}
      >
        📄 Télécharger PDF
      </button>

    </div>
  );
}