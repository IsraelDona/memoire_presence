package com.monprojet.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.monprojet.entity.LieuBenin;
import com.monprojet.repository.LieuBeninRepository;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class GeocodingService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final LieuBeninRepository lieuBeninRepository;

    public GeocodingService(LieuBeninRepository lieuBeninRepository) {
        this.lieuBeninRepository = lieuBeninRepository;
    }

    /*
     * Convertit des coordonnées GPS en nom de lieu lisible.
     * Essaie d'abord le géocodage inversé en ligne (Nominatim),
     * puis se replie sur la base locale des lieux du Bénin
     * si le service en ligne échoue.
     */
    public String obtenirNomLieu(double latitude, double longitude) {

        String nomLieuEnLigne = obtenirNomLieuEnLigne(latitude, longitude);

        if (nomLieuEnLigne != null) {
            return nomLieuEnLigne;
        }

        return obtenirNomLieuFallback(latitude, longitude);
    }

    private String obtenirNomLieuEnLigne(double latitude, double longitude) {

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

            return null;

        } catch (Exception e) {
            return null;
        }
    }

    /*
     * Repli sur la base locale des lieux du Bénin : cherche
     * le lieu connu le plus proche des coordonnées données.
     */
    private String obtenirNomLieuFallback(double latitude, double longitude) {

        try {
            LieuBenin lieuProche = lieuBeninRepository.findNearest(latitude, longitude);

            if (lieuProche != null) {
                return lieuProche.getNom();
            }

        } catch (Exception e) {
            // Ignoré, on retombe sur le message par défaut
        }

        return "Lieu non déterminé";
    }

    /*
     * Convertit un nom de lieu (texte libre saisi par un chef
     * de service) en coordonnées GPS. Cherche d'abord dans la
     * base locale des lieux du Bénin, puis se replie sur le
     * géocodage en ligne (Nominatim) si le nom n'y figure pas.
     * Retourne null si aucune coordonnée n'a pu être résolue.
     */
    public double[] obtenirCoordonnees(String nomLieu) {

        if (nomLieu == null || nomLieu.isBlank()) {
            return null;
        }

        return lieuBeninRepository.findByNomIgnoreCase(nomLieu.trim())
                .map(lieu -> new double[]{ lieu.getLatitude(), lieu.getLongitude() })
                .orElseGet(() -> obtenirCoordonneesEnLigne(nomLieu.trim()));
    }

    private double[] obtenirCoordonneesEnLigne(String nomLieu) {

        try {
            String url = String.format(
                    "https://nominatim.openstreetmap.org/search?format=json&q=%s&limit=1",
                    URLEncoder.encode(nomLieu + ", Bénin", StandardCharsets.UTF_8)
            );

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "e-presence-DGB-app");

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class
            );

            JsonNode racine = objectMapper.readTree(response.getBody());

            if (racine.isArray() && racine.size() > 0) {

                JsonNode premier = racine.get(0);

                return new double[]{
                        premier.get("lat").asDouble(),
                        premier.get("lon").asDouble()
                };
            }

            return null;

        } catch (Exception e) {
            return null;
        }
    }
}
