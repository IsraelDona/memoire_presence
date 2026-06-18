package com.monprojet.controller;

import java.io.ByteArrayInputStream;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.monprojet.dto.StatistiqueGlobaleResponse;
import com.monprojet.service.PdfService;
import com.monprojet.service.StatistiqueGlobaleService;

@RestController
@RequestMapping("/api/admin/pdf")
public class RapportPdfController {

    private final PdfService pdfService;

    private final StatistiqueGlobaleService
            statistiqueGlobaleService;

    public RapportPdfController(
            PdfService pdfService,
            StatistiqueGlobaleService
                    statistiqueGlobaleService) {

        this.pdfService = pdfService;

        this.statistiqueGlobaleService =
                statistiqueGlobaleService;
    }

    @GetMapping("/rapport")
    public ResponseEntity<InputStreamResource>
    genererPdf() {

        StatistiqueGlobaleResponse stats =
                statistiqueGlobaleService
                        .getStatistiquesGlobales();

        ByteArrayInputStream pdf =
                pdfService
                        .genererRapportPdf(stats);

        HttpHeaders headers =
                new HttpHeaders();

        headers.add(
                "Content-Disposition",
                "inline; filename=rapport_dgb.pdf"
        );

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(
                        MediaType.APPLICATION_PDF
                )
                .body(
                        new InputStreamResource(pdf)
                );
    }
}