import { useState, useEffect } from "react";
import "../../styles/PdfDashboard.css";
import {
  telechargerRapportPdf,
  getHistoriquePdf,
  supprimerRapportPdf,
  supprimerTousRapportsPdf,
} from "../../services/pdfService";

export default function PdfDashboard() {
  const [historique, setHistorique] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    chargerHistorique();
  }, []);

  async function chargerHistorique() {
    try {
      const data = await getHistoriquePdf();
      setHistorique(data);
    } catch {
      // silencieux
    }
  }

  async function handleGenerer() {
    setChargement(true);
    setMessage(null);
    try {
      await telechargerRapportPdf();
      setMessage({ type: "succes", texte: "Rapport généré et téléchargé avec succès." });
      setTimeout(() => setMessage(null), 4000);
      chargerHistorique();
    } catch {
      setMessage({ type: "erreur", texte: "Erreur lors de la génération du rapport." });
      // Le message inline disparaît après 4 secondes
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setChargement(false);
    }
  }

  async function handleSupprimer(id) {
    try {
      await supprimerRapportPdf(id);
      chargerHistorique();
    } catch {
      setMessage({ type: "erreur", texte: "Erreur lors de la suppression." });
    }
  }

  async function handleSupprimerTous() {
    if (!window.confirm("Supprimer tout l'historique PDF ?")) return;
    try {
      await supprimerTousRapportsPdf();
      setHistorique([]);
    } catch {
      setMessage({ type: "erreur", texte: "Erreur lors de la suppression." });
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function formatTaille(octets) {
    if (!octets) return "—";
    if (octets < 1024) return octets + " o";
    return (octets / 1024).toFixed(1) + " Ko";
  }

  return (
    <div className="pdf-page">

      {/* Carte génération */}
      <div className="pdf-card">
        <div className="pdf-card-left">
          <h2 className="pdf-titre">Rapports PDF</h2>
          <p className="pdf-desc">
            Générez un rapport mensuel complet des statistiques de présence,
            retards, absences, missions et réunions de la DGB.
            Le rapport est sauvegardé et consultable dans l'historique ci-dessous.
          </p>
        </div>
        <button
          className="pdf-btn"
          onClick={handleGenerer}
          disabled={chargement}
        >
          {chargement ? "⏳ Génération..." : "📄 Générer et télécharger"}
        </button>
      </div>

      {/* Message feedback */}
      {message && (
        <div className={`pdf-message pdf-message-${message.type}`}>
          {message.texte}
        </div>
      )}

      {/* Historique */}
      <div className="pdf-historique-section">
        <div className="pdf-historique-header">
          <h3 className="pdf-historique-titre">Historique des rapports</h3>
          {historique.length > 0 && (
            <button className="pdf-btn-danger" onClick={handleSupprimerTous}>
              🗑 Tout supprimer
            </button>
          )}
        </div>

        {historique.length === 0 ? (
          <p className="pdf-vide">Aucun rapport généré pour le moment.</p>
        ) : (
          <table className="pdf-table">
            <thead>
              <tr>
                <th>Nom du fichier</th>
                <th>Date de génération</th>
                <th>Généré par</th>
                <th>Taille</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {historique.map((r) => (
                <tr key={r.id}>
                  <td>{r.nomFichier}</td>
                  <td>{formatDate(r.dateGeneration)}</td>
                  <td>{r.generateurNom || "—"}</td>
                  <td>{formatTaille(r.taille)}</td>
                  <td>
                    <button
                      className="pdf-btn-supprimer"
                      onClick={() => handleSupprimer(r.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}