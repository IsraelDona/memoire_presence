package com.monprojet.controller;

import java.util.List;


import com.monprojet.entity.Presence;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.monprojet.dto.PointageRequest;
import com.monprojet.service.PresenceService;
import com.monprojet.service.FaceVerificationResult;
import com.monprojet.dto.FaceRegistrationRequest;

@RestController
@RequestMapping("/api/presences")
@CrossOrigin("*")
public class PresenceController {

    private final PresenceService presenceService;

    public PresenceController(
            PresenceService presenceService) {

        this.presenceService = presenceService;
    }

    /*
     * Contexte de pointage du jour : type de présence et lieu de
     * référence qui s'appliquent aujourd'hui à l'agent connecté.
     */
    @GetMapping("/contexte-jour")
    public ResponseEntity<com.monprojet.dto.ContextePointageResponse> contexteDuJour() {

        return ResponseEntity.ok(presenceService.getContexteDuJour());
    }

    /*
     * Vérifier si le pointage est possible (déjà marqué
     * aujourd'hui ? zone GPS autorisée ?) avant de demander
     * la vérification faciale, comme le décrit le diagramme
     * de séquence. Ne crée aucune présence.
     */
    @PostMapping("/verifier-zone")
    public ResponseEntity<String> verifierZone(
            @RequestBody PointageRequest request) {

        String message =
                presenceService
                        .verifierZone(request);

        if (message.equals("Zone autorisée")) {

            return ResponseEntity.ok(message);
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(message);
    }

    /*
     * Marquer présence
     */
    @PostMapping("/pointage")
    public ResponseEntity<String> marquerPresence(
            @RequestBody PointageRequest request) {

        String message =
                presenceService
                        .marquerPresence(request);

        if (message.equals(
                "Présence marquée avec succès")) {

            return ResponseEntity.ok(message);
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(message);
    }
    
    /*
     * Historique utilisateur connecté
     */
    @GetMapping("/mes-presences")
    public List<Presence> getMesPresences() {

        return presenceService.getMesPresences();
    }
    
    /*
     * Toutes les présences
     */
    @GetMapping("/toutes")
    public List<Presence> getToutesLesPresences() {

        return presenceService.getToutesLesPresences();
    }
    
    /*
     * Vérifier le visage avant le pointage
     */
    @PostMapping("/verifier-visage")
    public ResponseEntity<String> verifierVisage(
            @RequestBody FaceRegistrationRequest request) {

        FaceVerificationResult resultat = presenceService.verifierVisage(request);

        if (resultat.estReconnue()) {

            return ResponseEntity.ok(resultat.getMessage());
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(resultat.getMessage());
    }
}