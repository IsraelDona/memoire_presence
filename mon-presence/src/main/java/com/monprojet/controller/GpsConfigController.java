package com.monprojet.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.monprojet.entity.GpsConfig;
import com.monprojet.repository.GpsConfigRepository;
import com.monprojet.repository.UtilisateurRepository;
import com.monprojet.service.JournalService;
import com.monprojet.service.NotificationService;

@RestController
@RequestMapping("/api/gps")
public class GpsConfigController {

    private final GpsConfigRepository gpsConfigRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationService notificationService;
    private final JournalService journalService;

    public GpsConfigController(
            GpsConfigRepository gpsConfigRepository,
            UtilisateurRepository utilisateurRepository,
            NotificationService notificationService,
            JournalService journalService) {

        this.gpsConfigRepository = gpsConfigRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.notificationService = notificationService;
        this.journalService = journalService;
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getGpsConfig() {
        List<GpsConfig> configs = gpsConfigRepository.findAll();
        GpsConfig config;

        if (configs.isEmpty()) {
            config = new GpsConfig(
                "Ministère de l'Économie et des Finances",
                6.3703,
                2.3912,
                1.0
            );
            config = gpsConfigRepository.save(config);
        } else {
            config = configs.get(0);
        }

        return toResponse(config);
    }

    @PatchMapping("/config")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Map<String, Object>> updateGpsConfig(@RequestBody Map<String, Object> updates) {
        List<GpsConfig> configs = gpsConfigRepository.findAll();
        GpsConfig config = configs.isEmpty() ?
            new GpsConfig("Ministère de l'Économie et des Finances", 6.3703, 2.3912, 1.0) :
            configs.get(0);

        if (updates.containsKey("nomLieu")) {
            config.setNomLieu((String) updates.get("nomLieu"));
        }
        if (updates.containsKey("latitude")) {
            config.setLatitude(((Number) updates.get("latitude")).doubleValue());
        }
        if (updates.containsKey("longitude")) {
            config.setLongitude(((Number) updates.get("longitude")).doubleValue());
        }
        if (updates.containsKey("rayonKm")) {
            config.setRayonKm(((Number) updates.get("rayonKm")).doubleValue());
        }
        if (updates.containsKey("nombrePointagesParJour")) {
            config.setNombrePointagesParJour(((Number) updates.get("nombrePointagesParJour")).intValue());
        }
        if (updates.containsKey("modeTestSansZone")) {
            config.setModeTestSansZone((Boolean) updates.get("modeTestSansZone"));
        }

        config = gpsConfigRepository.save(config);

        String emailAdmin = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        utilisateurRepository.findByEmail(emailAdmin).ifPresent(admin -> {
            notificationService.creerNotification(
                    admin,
                    "Paramètres de pointage mis à jour",
                    "La zone GPS et les paramètres de pointage ont été modifiés avec succès."
            );

            journalService.ajouter(
                    admin.getNom() + " " + admin.getPrenom(),
                    "Modification des paramètres GPS",
                    "Configuration",
                    "Succès"
            );
        });

        return toResponse(config);
    }

    private ResponseEntity<Map<String, Object>> toResponse(GpsConfig config) {
        Map<String, Object> response = new HashMap<>();
        response.put("nom", config.getNomLieu());
        response.put("latitude", config.getLatitude());
        response.put("longitude", config.getLongitude());
        response.put("rayonKm", config.getRayonKm());
        response.put("nombrePointagesParJour", config.getNombrePointagesParJour());
        response.put("modeTestSansZone", config.isModeTestSansZone());

        return ResponseEntity.ok(response);
    }
}
