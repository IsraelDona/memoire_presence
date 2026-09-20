package com.monprojet.controller;

import org.springframework.web.bind.annotation.*;
import com.monprojet.service.GeocodingService;

@RestController
@RequestMapping("/api/geocoding")
public class GeocodingController {

    private final GeocodingService geocodingService;

    public GeocodingController(GeocodingService geocodingService) {
        this.geocodingService = geocodingService;
    }

    @GetMapping("/reverse")
    public java.util.Map<String, String> reverseGeocode(
            @RequestParam double latitude,
            @RequestParam double longitude) {

        String nomLieu = geocodingService.obtenirNomLieu(latitude, longitude);
        return java.util.Map.of("nomLieu", nomLieu);
    }
}