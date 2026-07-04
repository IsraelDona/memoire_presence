package com.monprojet.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class FaceComparisonService {

    @Value("${facepp.api.key}")
    private String apiKey;

    @Value("${facepp.api.secret}")
    private String apiSecret;

    private static final String FACEPP_URL =
            "https://api-us.faceplusplus.com/facepp/v3/compare";

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean comparerVisages(
            String photoReference,
            String photoCapturee) {

        try {
            // Nettoyer le préfixe base64 si présent
            String ref = nettoyerBase64(photoReference);
            String cap = nettoyerBase64(photoCapturee);

            MultiValueMap<String, String> params =
                    new LinkedMultiValueMap<>();
            params.add("api_key", apiKey);
            params.add("api_secret", apiSecret);
            params.add("image_base64_1", ref);
            params.add("image_base64_2", cap);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(
                    MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> entity =
                    new HttpEntity<>(params, headers);

            ResponseEntity<Map> response =
                    restTemplate.postForEntity(
                            FACEPP_URL, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK
                    && response.getBody() != null) {

                Object confidence = response.getBody()
                        .get("confidence");

                if (confidence != null) {
                    double score = ((Number) confidence)
                            .doubleValue();
                    // Seuil : 75% de similarité minimum
                    return score >= 75.0;
                }
            }

            return false;

        } catch (Exception e) {
            System.err.println(
                    "Erreur Face++ : " + e.getMessage());
            return false;
        }
    }

    private String nettoyerBase64(String base64) {
        if (base64 != null && base64.contains(",")) {
            return base64.split(",")[1];
        }
        return base64;
    }
}