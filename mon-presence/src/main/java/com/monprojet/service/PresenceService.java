package com.monprojet.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.monprojet.dto.PointageRequest;
import com.monprojet.entity.Presence;
import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.StatutPresence;
import com.monprojet.repository.PresenceRepository;
import com.monprojet.repository.UtilisateurRepository;

@Service
public class PresenceService {

    private final PresenceRepository presenceRepository;

    private final UtilisateurRepository utilisateurRepository;

    /*
     * Coordonnées DGB / Ministère
     */
    private static final double DGB_LATITUDE = 6.3703;

    private static final double DGB_LONGITUDE = 2.3912;

    /*
     * Rayon autorisé autour du ministère
     * (1 km)
     */
    private static final double RAYON_AUTORISE_KM = 1.0;

    public PresenceService(
            PresenceRepository presenceRepository,
            UtilisateurRepository utilisateurRepository) {

        this.presenceRepository =
                presenceRepository;

        this.utilisateurRepository =
                utilisateurRepository;
    }

    /*
     * Pointage présence
     */
    public String marquerPresence(
            PointageRequest request) {

        /*
         * Utilisateur connecté via JWT
         */
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email =
                authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElse(null);

        if (utilisateur == null) {

            return "Utilisateur introuvable";
        }

        /*
         * Vérification GPS
         */
        if (request.getLatitude() == null
                || request.getLongitude() == null) {

            return "Position GPS introuvable";
        }

        double distanceKm =
                calculerDistanceKm(
                        request.getLatitude(),
                        request.getLongitude(),
                        DGB_LATITUDE,
                        DGB_LONGITUDE
                );

        /*
         * Vérifie si agent dans la zone autorisée
         */
        if (distanceKm >
                RAYON_AUTORISE_KM) {

            return String.format(
                    "Pointage refusé : vous êtes à %.2f km du ministère. Rayon autorisé : %.0f km",
                    distanceKm,
                    RAYON_AUTORISE_KM
            );
        }

        /*
         * Vérifie si déjà pointé aujourd'hui
         */
        boolean dejaPointe =
                presenceRepository
                        .findByUtilisateurAndDatePresence(
                                utilisateur,
                                LocalDate.now()
                        )
                        .isPresent();

        if (dejaPointe) {

            return "Présence déjà marquée aujourd'hui";
        }

        /*
         * Création présence
         */
        Presence presence =
                new Presence();

        presence.setDatePresence(
                LocalDate.now()
        );

        presence.setHeurePointage(
                LocalDateTime.now()
        );

        presence.setLatitude(
                request.getLatitude()
        );

        presence.setLongitude(
                request.getLongitude()
        );

        presence.setTypePresence(
                request.getTypePresence()
        );

        /*
         * Détermination statut
         */
        LocalTime heureActuelle =
                LocalTime.now();

        LocalTime heureLimite =
                LocalTime.of(8, 15);

        if (heureActuelle
                .isAfter(heureLimite)) {

            presence.setStatutPresence(
                    StatutPresence.RETARD
            );

        } else {

            presence.setStatutPresence(
                    StatutPresence.PRESENT
            );
        }

        presence.setUtilisateur(
                utilisateur
        );

        presenceRepository.save(
                presence
        );

        return "Présence marquée avec succès";
    }

    /*
     * Calcul distance GPS
     * Formule Haversine
     */
    private double calculerDistanceKm(
            double latitude1,
            double longitude1,
            double latitude2,
            double longitude2) {

        final double RAYON_TERRE_KM =
                6371;

        double deltaLatitude =
                Math.toRadians(
                        latitude2
                                - latitude1
                );

        double deltaLongitude =
                Math.toRadians(
                        longitude2
                                - longitude1
                );

        double a =
                Math.sin(
                        deltaLatitude / 2
                )
                        *
                        Math.sin(
                                deltaLatitude / 2
                        )
                        +
                        Math.cos(
                                Math.toRadians(
                                        latitude1
                                )
                        )
                        *
                        Math.cos(
                                Math.toRadians(
                                        latitude2
                                )
                        )
                        *
                        Math.sin(
                                deltaLongitude / 2
                        )
                        *
                        Math.sin(
                                deltaLongitude / 2
                        );

        double c =
                2 * Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                );

        return RAYON_TERRE_KM * c;
    }

    /*
     * Historique utilisateur connecté
     */
    public List<Presence>
    getMesPresences() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email =
                authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElse(null);

        if (utilisateur == null) {

            return List.of();
        }

        return presenceRepository
                .findByUtilisateurOrderByDatePresenceDesc(
                        utilisateur
                );
    }

    /*
     * Toutes les présences
     */
    public List<Presence>
    getToutesLesPresences() {

        return presenceRepository
                .findAllByOrderByDatePresenceDesc();
    }
    
    /*
     * Vérification faciale avant pointage
     */
    public boolean verifierVisage(com.monprojet.dto.FaceRegistrationRequest request) {
        /*
         * Récupération de l'utilisateur connecté via le token JWT
         */
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email = authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElse(null);

        if (utilisateur == null) {
            return false;
        }

        /*
         * Vérification de l'existence d'une photo de référence
         */
        if (utilisateur.getPhotoVisage() == null) {
            return false;
        }

        /*
         * LOGIQUE DE COMPARAISON (Simulation pour le prototype d'application)
         * Ici, on valide si le frontend envoie bien une image capturée valide.
         */
        String imageCapturee = request.getPhotoVisage();
        if (imageCapturee != null && !imageCapturee.trim().isEmpty()) {
            // Dans une version de production, tu ajouterais ici ton appel vers un service d'IA
            // ou une bibliothèque de comparaison faciale.
            return true;
        }

        return false;
    }
}