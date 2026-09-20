package com.monprojet.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class FaceComparisonService {

    @Value("${facepp.api.key}")
    private String apiKey;

    @Value("${facepp.api.secret}")
    private String apiSecret;

    private static final String FACEPP_COMPARE_URL =
            "https://api-us.faceplusplus.com/facepp/v3/compare";

    private static final String FACEPP_DETECT_URL =
            "https://api-us.faceplusplus.com/facepp/v3/detect";

    private final RestTemplate restTemplate = new RestTemplate();

    public FaceVerificationResult comparerVisages(
            String photoReference,
            String photoCapturee) {

        try {

            String reference = nettoyerBase64(photoReference);
            String capture = nettoyerBase64(photoCapturee);

            /*
             * Vérifier que la photo capturée contient
             * bien un visage exploitable.
             */
            if (!visageDetecte(capture)) {

                System.out.println(
                        "Face++ : capture de mauvaise qualité ou visage non exploitable."
                );

                return FaceVerificationResult.mauvaiseCapture();
            }

            /*
             * Comparaison de la photo de référence
             * avec la photo prise lors du pointage.
             */
            MultiValueMap<String, String> params =
                    new LinkedMultiValueMap<>();

            params.add("api_key", apiKey);
            params.add("api_secret", apiSecret);
            params.add("image_base64_1", reference);
            params.add("image_base64_2", capture);

            HttpHeaders headers = new HttpHeaders();

            headers.setContentType(
                    MediaType.APPLICATION_FORM_URLENCODED
            );

            HttpEntity<MultiValueMap<String, String>> entity =
                    new HttpEntity<>(params, headers);

            ResponseEntity<Map> response =
                    restTemplate.postForEntity(
                            FACEPP_COMPARE_URL,
                            entity,
                            Map.class
                    );

            if (response.getStatusCode() != HttpStatus.OK
                    || response.getBody() == null) {

                System.out.println(
                        "Face++ : réponse invalide."
                );

                return FaceVerificationResult.mauvaiseCapture();
            }

            Map body = response.getBody();

            Object confidenceObject =
                    body.get("confidence");

            if (confidenceObject == null) {

                System.out.println(
                        "Face++ : aucun résultat de comparaison."
                );

                return FaceVerificationResult.mauvaiseCapture();
            }

            double confidence =
                    ((Number) confidenceObject).doubleValue();

            /*
             * Seuil le plus strict recommandé par Face++ (1e-5,
             * soit 0.001% de risque de faux acceptation). Un
             * pointage professionnel ne peut pas se permettre
             * d'accepter le mauvais visage : mieux vaut refuser
             * une personne légitime par erreur (elle peut
             * réessayer) que d'accepter un imposteur.
             */
            Map thresholds =
                    (Map) body.get("thresholds");

            double seuil = 80.0;

            if (thresholds != null) {

                Object seuilFacePP =
                        thresholds.get("1e-5");

                if (seuilFacePP != null) {

                    seuil =
                            ((Number) seuilFacePP).doubleValue();
                }
            }

            System.out.println(
                    "Face++ confidence = "
                            + confidence
                            + " | seuil = "
                            + seuil
            );

            /*
             * Visage reconnu.
             */
            if (confidence >= seuil) {

                return FaceVerificationResult.reconnue(
                        "Visage reconnu avec succès"
                );
            }

            /*
             * Un visage est bien détecté mais il ne correspond
             * pas suffisamment au visage de référence.
             */
            return FaceVerificationResult.personneDifferente(
                    "Visage non reconnu : cette personne ne correspond pas au visage enregistré."
            );

        } catch (Exception e) {

            System.err.println(
                    "Erreur Face++ : "
                            + e.getMessage()
            );

            return FaceVerificationResult.mauvaiseCapture();
        }
    }

    /*
     * Vérifie si Face++ arrive à détecter
     * un visage dans la photo capturée.
     */
    private boolean visageDetecte(String imageBase64) {

        try {

            if (imageBase64 == null || imageBase64.trim().isEmpty()) {
                System.out.println("Face++ DEBUG : image base64 vide ou nulle.");
                return false;
            }

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("api_key", apiKey);
            params.add("api_secret", apiSecret);
            params.add("image_base64", imageBase64);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(FACEPP_DETECT_URL, entity, Map.class);

            System.out.println("Face++ DEBUG : statut HTTP = " + response.getStatusCode());
            System.out.println("Face++ DEBUG : corps réponse = " + response.getBody());

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                System.out.println("Face++ DEBUG : réponse non-OK ou corps nul.");
                return false;
            }

            Map body = response.getBody();
            Object facesObject = body.get("faces");

            if (!(facesObject instanceof List)) {
                System.out.println("Face++ DEBUG : champ 'faces' absent ou mal formé. Corps complet : " + body);
                return false;
            }

            List faces = (List) facesObject;

            System.out.println("Face++ DEBUG : nombre de visages détectés = " + faces.size());

            return !faces.isEmpty();

        } catch (Exception e) {
            System.err.println("Erreur détection Face++ : " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /*
     * Supprime le préfixe :
     *
     * data:image/jpeg;base64,
     *
     * pour ne garder que le Base64.
     */
    private String nettoyerBase64(String base64) {

        if (base64 == null) {

            return null;
        }

        if (base64.contains(",")) {

            return base64.split(",", 2)[1];
        }

        return base64;
    }
}