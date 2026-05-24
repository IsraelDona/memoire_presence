package com.monprojet.service;

import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

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

    public PresenceService(
            PresenceRepository presenceRepository,
            UtilisateurRepository utilisateurRepository) {

        this.presenceRepository = presenceRepository;
        this.utilisateurRepository = utilisateurRepository;
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

        if (heureActuelle.isAfter(heureLimite)) {

            presence.setStatutPresence(
                    StatutPresence.RETARD
            );

        } else {

            presence.setStatutPresence(
                    StatutPresence.PRESENT
            );
        }

        presence.setUtilisateur(utilisateur);

        presenceRepository.save(presence);

        return "Présence marquée avec succès";
    }
    /*
     * Historique utilisateur connecté
     */
    public List<Presence> getMesPresences() {

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
    public List<Presence> getToutesLesPresences() {

        return presenceRepository
                .findAllByOrderByDatePresenceDesc();
    }
}