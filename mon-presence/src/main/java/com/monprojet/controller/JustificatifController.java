package com.monprojet.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.monprojet.dto.JustificatifRequest;
import com.monprojet.dto.RefusJustificatifRequest;
import com.monprojet.entity.Justificatif;
import com.monprojet.service.JustificatifService;

@RestController
@RequestMapping("/api/agent/justificatifs")
public class JustificatifController {

    private final JustificatifService
            justificatifService;

    public JustificatifController(
            JustificatifService
                    justificatifService) {

        this.justificatifService =
                justificatifService;
    }

    @PostMapping
    public String envoyer(
            @RequestBody
            JustificatifRequest request) {

        return justificatifService
                .envoyerJustificatif(
                        request);
    }

    @GetMapping("/mes")
    public List<Justificatif>
    mesJustificatifs() {

        return justificatifService
                .getMesJustificatifs();
    }

    @GetMapping
    public List<Justificatif>
    tousLesJustificatifs() {

        return justificatifService
                .getTousLesJustificatifs();
    }

    @PutMapping("/{id}/accepter")
    public String accepter(
            @PathVariable Long id) {

        return justificatifService
                .accepter(id);
    }

    @PutMapping("/{id}/refuser")
    public String refuser(
            @PathVariable Long id,
            @RequestBody
            RefusJustificatifRequest request) {

        return justificatifService
                .refuser(id, request);
    }
}