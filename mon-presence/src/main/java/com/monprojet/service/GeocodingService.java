package com.monprojet.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GeocodingService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /*
     * Convertit des coordonnées GPS en adresse lisible
     * via Nominatim (OpenStreetMap), comme un reverse geocoding Google Maps.
     */
    public String obtenirNomLieu(double latitude, double longitude) {

        try {
            String url = String.format(
                    "https://nominatim.openstreetmap.org/reverse?format=json&lat=%s&lon=%s&zoom=16&addressdetails=1",
                    latitude, longitude
            );

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "e-presence-DGB-app");

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class
            );

            JsonNode racine = objectMapper.readTree(response.getBody());

            if (racine.has("display_name")) {
                return racine.get("display_name").asText();
            }

            return "Lieu inconnu";

        } catch (Exception e) {
            return "Lieu non déterminé";
        }
    }
}