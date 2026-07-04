package com.monprojet.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.springframework.stereotype.Service;

import com.monprojet.entity.RapportPdf;
import com.monprojet.repository.RapportPdfRepository;

@Service
public class RapportPdfService {

    private final RapportPdfRepository rapportPdfRepository;

    public RapportPdfService(
            RapportPdfRepository rapportPdfRepository) {

        this.rapportPdfRepository = rapportPdfRepository;
    }

    public List<RapportPdf> getTous() {

        return rapportPdfRepository
                .findAllByOrderByDateGenerationDesc();
    }

    public RapportPdf getById(Long id) {

        return rapportPdfRepository
                .findById(id)
                .orElseThrow(
                        () -> new RuntimeException("Rapport introuvable"));
    }

    public void supprimer(Long id)
            throws IOException {

        RapportPdf rapport = getById(id);

        Files.deleteIfExists(
                Path.of(rapport.getChemin()));

        rapportPdfRepository.delete(rapport);
    }

    public void supprimerTous()
            throws IOException {

        List<RapportPdf> rapports =
                rapportPdfRepository.findAll();

        for (RapportPdf rapport : rapports) {

            Files.deleteIfExists(
                    Path.of(rapport.getChemin()));
        }

        rapportPdfRepository.deleteAll();
    }
}