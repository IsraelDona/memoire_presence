package com.monprojet.service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

import org.springframework.stereotype.Service;

import com.itextpdf.text.Document;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfWriter;
import com.monprojet.dto.StatistiqueGlobaleResponse;

@Service
public class PdfService {

    public ByteArrayInputStream genererRapportPdf(
            StatistiqueGlobaleResponse stats) {

        Document document =
                new Document();

        ByteArrayOutputStream out =
                new ByteArrayOutputStream();

        try {

            PdfWriter.getInstance(
                    document,
                    out);

            document.open();

            document.add(
                    new Paragraph(
                            "RAPPORT MENSUEL DGB"
                    )
            );

            document.add(
                    new Paragraph(" ")
            );

            document.add(
                    new Paragraph(
                            "Nombre Agents : "
                                    + stats.getNombreAgents()
                    )
            );

            document.add(
                    new Paragraph(
                            "Présences : "
                                    + stats.getNombrePresences()
                    )
            );

            document.add(
                    new Paragraph(
                            "Retards : "
                                    + stats.getNombreRetards()
                    )
            );

            document.add(
                    new Paragraph(
                            "Justificatifs : "
                                    + stats.getNombreJustificatifs()
                    )
            );

            document.add(
                    new Paragraph(
                            "Missions : "
                                    + stats.getNombreMissions()
                    )
            );

            document.add(
                    new Paragraph(
                            "Réunions : "
                                    + stats.getNombreReunions()
                    )
            );

            document.add(
                    new Paragraph(
                            "Score Global : "
                                    + stats.getScoreGlobalPonctualite()
                                    + "%"
                    )
            );

            document.close();
            String nomFichier =
                    "rapport_dgb_"
                            + LocalDateTime.now()
                            .format(
                                    DateTimeFormatter.ofPattern(
                                            "yyyy_MM_dd_HH_mm_ss"))
                            + ".pdf";

            Path chemin =
                    Paths.get(
                            "src/main/resources/rapports/",
                            nomFichier);

            Files.write(
                    chemin,
                    out.toByteArray());

            RapportPdf rapport =
                    new RapportPdf();

            rapport.setNomFichier(
                    nomFichier);

            rapport.setDateGeneration(
                    LocalDateTime.now());

            rapport.setChemin(
                    chemin.toString());

            rapport.setTaille(
                    Files.size(chemin));

            rapportPdfRepository.save(
                    rapport);

        } catch (Exception e) {

            e.printStackTrace();
        }

        return new ByteArrayInputStream(
                out.toByteArray()
        );
    }
}