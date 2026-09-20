package com.monprojet.service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.monprojet.dto.StatistiqueGlobaleResponse;
import com.monprojet.entity.Utilisateur;

import java.util.List;

@Service
public class PdfService {

    public ByteArrayInputStream genererRapportPdf(
            StatistiqueGlobaleResponse stats,
            String generateurNom,
            List<Utilisateur> agents) {

        Document document = new Document(PageSize.A4, 50, 50, 60, 60);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            // Polices
            Font fontTitrePrincipal = new Font(Font.FontFamily.HELVETICA, 22, Font.BOLD, new BaseColor(30, 94, 255));
            Font fontSousTitre      = new Font(Font.FontFamily.HELVETICA, 13, Font.NORMAL, new BaseColor(80, 80, 80));
            Font fontSectionTitre   = new Font(Font.FontFamily.HELVETICA, 13, Font.BOLD,   new BaseColor(30, 94, 255));
            Font fontLabel          = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD,   BaseColor.BLACK);
            Font fontValeur         = new Font(Font.FontFamily.HELVETICA, 11, Font.NORMAL, new BaseColor(50, 50, 50));
            Font fontFooter         = new Font(Font.FontFamily.HELVETICA,  9, Font.ITALIC, new BaseColor(120, 120, 120));

            String dateStr = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));

            // En-tête
            Paragraph entete = new Paragraph("DI — e-présence", fontTitrePrincipal);
            entete.setAlignment(Element.ALIGN_CENTER);
            document.add(entete);

            Paragraph sousTitre = new Paragraph("Direction de l'Informatique de la Direction Générale du Budget", fontSousTitre);
            sousTitre.setAlignment(Element.ALIGN_CENTER);
            document.add(sousTitre);

            document.add(new Paragraph(" "));

            // Ligne séparatrice
            PdfContentByte cb = writer.getDirectContent();
            cb.setColorStroke(new BaseColor(30, 94, 255));
            cb.setLineWidth(1.5f);
            cb.moveTo(50, document.top() - 80);
            cb.lineTo(document.right() - 50, document.top() - 80);
            cb.stroke();

            document.add(new Paragraph(" "));

            // Titre rapport
            Paragraph titrePrincipal = new Paragraph("RAPPORT MENSUEL DE PRÉSENCE", fontTitrePrincipal);
            titrePrincipal.setAlignment(Element.ALIGN_CENTER);
            titrePrincipal.setSpacingBefore(10);
            document.add(titrePrincipal);

            Paragraph meta = new Paragraph(
                "Généré le : " + dateStr + "   |   Par : " + generateurNom,
                fontSousTitre);
            meta.setAlignment(Element.ALIGN_CENTER);
            meta.setSpacingAfter(20);
            document.add(meta);

            document.add(new Paragraph(" "));

            // Section 1 — Statistiques globales
            document.add(titreSectionAvecLigne("1. Statistiques globales", fontSectionTitre));
            document.add(ligneStatistique("Nombre d'agents", String.valueOf(stats.getNombreAgents()), fontLabel, fontValeur));
            document.add(ligneStatistique("Présences enregistrées", String.valueOf(stats.getNombrePresences()), fontLabel, fontValeur));
            document.add(ligneStatistique("Retards constatés", String.valueOf(stats.getNombreRetards()), fontLabel, fontValeur));
            document.add(ligneStatistique("Absences", String.valueOf(stats.getNombreAbsences()), fontLabel, fontValeur));
            document.add(ligneStatistique(
                    "Score global de ponctualité",
                    String.format("%.2f %%", stats.getScoreGlobalPonctualite()),
                    fontLabel, fontValeur));

            document.add(new Paragraph(" "));

            // Section 2 — Activités
            document.add(titreSectionAvecLigne("2. Activités du service", fontSectionTitre));
            document.add(ligneStatistique("Justificatifs soumis", String.valueOf(stats.getNombreJustificatifs()), fontLabel, fontValeur));
            document.add(ligneStatistique("Missions créées", String.valueOf(stats.getNombreMissions()), fontLabel, fontValeur));
            document.add(ligneStatistique("Réunions organisées", String.valueOf(stats.getNombreReunions()), fontLabel, fontValeur));

            document.add(new Paragraph(" "));

            // Section 3 — Évolution mensuelle
            if (stats.getEvolutionMensuelle() != null && !stats.getEvolutionMensuelle().isEmpty()) {
                document.add(titreSectionAvecLigne("3. Évolution mensuelle de la ponctualité", fontSectionTitre));

                PdfPTable table = new PdfPTable(2);
                table.setWidthPercentage(60);
                table.setHorizontalAlignment(Element.ALIGN_LEFT);
                table.setSpacingBefore(8);

                PdfPCell cellMois = new PdfPCell(new Phrase("Mois", fontLabel));
                PdfPCell cellScore = new PdfPCell(new Phrase("Score (%)", fontLabel));
                cellMois.setBackgroundColor(new BaseColor(230, 236, 255));
                cellScore.setBackgroundColor(new BaseColor(230, 236, 255));
                cellMois.setPadding(6);
                cellScore.setPadding(6);
                table.addCell(cellMois);
                table.addCell(cellScore);

                for (var evo : stats.getEvolutionMensuelle()) {
                    PdfPCell cm = new PdfPCell(new Phrase(evo.getMois(), fontValeur));
                    PdfPCell cs = new PdfPCell(new Phrase(String.format("%.1f", evo.getTauxPonctualite()), fontValeur));
                    cm.setPadding(5);
                    cs.setPadding(5);
                    table.addCell(cm);
                    table.addCell(cs);
                }
                document.add(table);
                document.add(new Paragraph(" "));
            }

            // Section 4 — Effectif nominatif
            if (agents != null && !agents.isEmpty()) {
                document.add(titreSectionAvecLigne("4. Effectif", fontSectionTitre));

                PdfPTable tableAgents = new PdfPTable(new float[]{ 2f, 3.5f, 3f, 2.5f });
                tableAgents.setWidthPercentage(100);
                tableAgents.setSpacingBefore(8);

                for (String entete2 : new String[]{ "Matricule", "Nom et prénom", "Poste", "Grade" }) {
                    PdfPCell c = new PdfPCell(new Phrase(entete2, fontLabel));
                    c.setBackgroundColor(new BaseColor(230, 236, 255));
                    c.setPadding(6);
                    tableAgents.addCell(c);
                }

                for (Utilisateur agent : agents) {
                    String nomComplet =
                            (agent.getNom() == null ? "" : agent.getNom())
                            + " " + (agent.getPrenom() == null ? "" : agent.getPrenom());

                    for (String valeur : new String[]{
                            valeurOuTiret(agent.getMatricule()),
                            nomComplet.trim().isEmpty() ? "—" : nomComplet.trim(),
                            valeurOuTiret(agent.getPoste()),
                            valeurOuTiret(agent.getGrade()) }) {

                        PdfPCell c = new PdfPCell(new Phrase(valeur, fontValeur));
                        c.setPadding(5);
                        tableAgents.addCell(c);
                    }
                }

                document.add(tableAgents);
                document.add(new Paragraph(" "));
            }

            // Footer
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));
            Paragraph footer = new Paragraph(
                "Ce rapport est généré automatiquement par le système e-présence de la DI. " +
                "Document confidentiel — usage interne uniquement.",
                fontFooter);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();

        } catch (Exception e) {
            e.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    private String valeurOuTiret(String valeur) {
        return (valeur == null || valeur.isBlank()) ? "—" : valeur;
    }

    private Paragraph titreSectionAvecLigne(String texte, Font font) {
        Paragraph p = new Paragraph(texte, font);
        p.setSpacingBefore(10);
        p.setSpacingAfter(6);
        return p;
    }

    private Paragraph ligneStatistique(String label, String valeur, Font fontLabel, Font fontValeur) {
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + " : ", fontLabel));
        p.add(new Chunk(valeur, fontValeur));
        p.setSpacingAfter(4);
        return p;
    }
}