package com.monprojet.controller;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.monprojet.dto.StatistiqueGlobaleResponse;
import com.monprojet.entity.RapportPdf;
import com.monprojet.repository.RapportPdfRepository;
import com.monprojet.service.PdfService;
import com.monprojet.service.StatistiqueGlobaleService;
import org.springframework.security.core.userdetails.UserDetails;



@RestController
@RequestMapping("/api/admin/pdf")
public class RapportPdfController {

    private final PdfService pdfService;
    private final StatistiqueGlobaleService statistiqueGlobaleService;
    private final RapportPdfRepository rapportPdfRepository;

    private static final String DOSSIER_PDF = "rapports/";

    public RapportPdfController(
            PdfService pdfService,
            StatistiqueGlobaleService statistiqueGlobaleService,
            RapportPdfRepository rapportPdfRepository) {
        this.pdfService = pdfService;
        this.statistiqueGlobaleService = statistiqueGlobaleService;
        this.rapportPdfRepository = rapportPdfRepository;
    }

    @GetMapping("/rapport")
    public ResponseEntity<InputStreamResource> genererPdf(
            @AuthenticationPrincipal UserDetails userDetails) throws IOException {

        StatistiqueGlobaleResponse stats = statistiqueGlobaleService.getStatistiquesGlobales();

        String generateurNom = userDetails.getUsername();
        ByteArrayInputStream pdf = pdfService.genererRapportPdf(stats, generateurNom);

        // Sauvegarde sur disque
        String nomFichier = "rapport_dgb_"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
                + ".pdf";

        File dossier = new File(DOSSIER_PDF);
        if (!dossier.exists()) dossier.mkdirs();

        File fichier = new File(DOSSIER_PDF + nomFichier);
        byte[] contenu = pdf.readAllBytes();
        try (FileOutputStream fos = new FileOutputStream(fichier)) {
            fos.write(contenu);
        }

        // Enregistrement en base
        RapportPdf rapport = new RapportPdf();
        rapport.setNomFichier(nomFichier);
        rapport.setDateGeneration(LocalDateTime.now());
        rapport.setChemin(fichier.getAbsolutePath());
        rapport.setTaille(fichier.length());
        rapport.setGenerateurNom(generateurNom);
        rapport.setRole("ADMIN");
        rapportPdfRepository.save(rapport);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=" + nomFichier);

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(
                        new java.io.ByteArrayInputStream(contenu)));
    }
}