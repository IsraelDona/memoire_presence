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
            

        } catch (Exception e) {

            e.printStackTrace();
        }

        return new ByteArrayInputStream(
                out.toByteArray()
        );
    }
}