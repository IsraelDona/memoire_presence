package com.monprojet.controller;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.monprojet.entity.RapportPdf;
import com.monprojet.service.RapportPdfService;

@RestController
@RequestMapping("/api/admin/rapports-pdf")
public class HistoriquePdfController {

    private final RapportPdfService service;

    public HistoriquePdfController(
            RapportPdfService service) {

        this.service = service;
    }

    @GetMapping
    public List<RapportPdf> getTous() {

        return service.getTous();
    }

    @GetMapping("/telecharger/{id}")
    public ResponseEntity<Resource>
    telecharger(
            @PathVariable Long id)
            throws MalformedURLException {

        RapportPdf pdf =
                service.getById(id);

        Path path =
                Path.of(pdf.getChemin());

        Resource resource =
                new UrlResource(
                        path.toUri());

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename="
                                + pdf.getNomFichier())
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public void supprimer(
            @PathVariable Long id)
            throws IOException {

        service.supprimer(id);
    }

    @DeleteMapping("/tout")
    public void supprimerTous()
            throws IOException {

        service.supprimerTous();
    }

}