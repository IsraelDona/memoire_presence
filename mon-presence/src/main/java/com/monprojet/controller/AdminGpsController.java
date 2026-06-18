package com.monprojet.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.monprojet.config.ZoneGpsConfig;
import com.monprojet.dto.UpdateZoneGpsRequest;

@RestController
@RequestMapping("/api/admin/gps")
public class AdminGpsController {

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
            }}
        );
    }

    /*
     * Modifier la zone GPS
     */
    @PatchMapping
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<String> updateZoneGps(
            @RequestBody UpdateZoneGpsRequest request) {

        if (request.getLatitude() == null
                || request.getLongitude() == null
                || request.getRayonKm() == null) {
            return ResponseEntity.badRequest()
                    .body("Latitude, longitude et rayon obligatoires");
        }

        ZoneGpsConfig.latitude = request.getLatitude();
        ZoneGpsConfig.longitude = request.getLongitude();
        ZoneGpsConfig.rayonKm = request.getRayonKm();

        return ResponseEntity.ok("Zone GPS mise à jour avec succès");
    }
}