package com.monprojet.controller;

import java.util.List;

import com.monprojet.entity.Presence;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.monprojet.dto.PointageRequest;
import com.monprojet.service.PresenceService;

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
}