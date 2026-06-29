package com.monprojet.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.monprojet.config.ZoneGpsConfig;
import com.monprojet.dto.UpdateZoneGpsRequest;
import com.monprojet.service.GeocodingService;
import com.monprojet.repository.*;
import com.monprojet.service.*;

@RestController
@RequestMapping("/api/admin/gps")
public class AdminGpsController {

	private final GeocodingService geocodingService;
	private final NotificationService notificationService;
	private final UtilisateurRepository utilisateurRepository;

	public AdminGpsController(
	        GeocodingService geocodingService,
	        NotificationService notificationService,
	        com.monprojet.repository.UtilisateurRepository utilisateurRepository) {
	    this.geocodingService = geocodingService;
	    this.notificationService = notificationService;
	    this.utilisateurRepository = utilisateurRepository;
	}

    /*
     * Récupérer la config GPS actuelle
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<?> getZoneGps() {
        return ResponseEntity.ok(
            new java.util.HashMap<String, Object>() {{
                put("latitude", ZoneGpsConfig.latitude);
                put("longitude", ZoneGpsConfig.longitude);
                put("rayonKm", ZoneGpsConfig.rayonKm);
                put("nomLieu", ZoneGpsConfig.nomLieu);
                put("nombrePointagesParJour", ZoneGpsConfig.nombrePointagesParJour);
                put("modeTestSansZone", ZoneGpsConfig.modeTestSansZone);
            }}
        );
    }

    /*
     * Modifier la zone GPS et les paramètres de pointage
     */
    @PatchMapping
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<?> updateZoneGps(
            @RequestBody UpdateZoneGpsRequest request) {

        if (request.getLatitude() != null
                && request.getLongitude() != null
                && request.getRayonKm() != null) {

            ZoneGpsConfig.latitude = request.getLatitude();
            ZoneGpsConfig.longitude = request.getLongitude();
            ZoneGpsConfig.rayonKm = request.getRayonKm();

            ZoneGpsConfig.nomLieu = geocodingService.obtenirNomLieu(
                    request.getLatitude(), request.getLongitude()
            );
        }

        if (request.getNombrePointagesParJour() != null) {
            int valeur = request.getNombrePointagesParJour();

            if (valeur < 1 || valeur > 3) {
                return ResponseEntity.badRequest()
                        .body("Le nombre de pointages par jour doit être entre 1 et 3");
            }

            ZoneGpsConfig.nombrePointagesParJour = valeur;
        }

        if (request.getModeTestSansZone() != null) {
            ZoneGpsConfig.modeTestSansZone = request.getModeTestSansZone();
        }
        String emailAdmin = org.springframework.security.core.context
                .SecurityContextHolder.getContext()
                .getAuthentication().getName();

        utilisateurRepository.findByEmail(emailAdmin).ifPresent(admin ->
                notificationService.creerNotification(
                        admin,
                        "Paramètres de pointage mis à jour",
                        "La zone GPS et les paramètres de pointage ont été modifiés avec succès."
                )
        );

        return ResponseEntity.ok(
            new java.util.HashMap<String, Object>() {{
                put("latitude", ZoneGpsConfig.latitude);
                put("longitude", ZoneGpsConfig.longitude);
                put("rayonKm", ZoneGpsConfig.rayonKm);
                put("nomLieu", ZoneGpsConfig.nomLieu);
                put("nombrePointagesParJour", ZoneGpsConfig.nombrePointagesParJour);
                put("modeTestSansZone", ZoneGpsConfig.modeTestSansZone);
            }}
        );
    }
}