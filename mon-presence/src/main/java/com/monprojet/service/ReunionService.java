package com.monprojet.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.monprojet.dto.ReunionRequest;
import com.monprojet.entity.Reunion;
import com.monprojet.entity.Utilisateur;
import com.monprojet.repository.ReunionRepository;
import com.monprojet.repository.UtilisateurRepository;

@Service
public class ReunionService {

    private final ReunionRepository reunionRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationService notificationService;
    private final GeocodingService geocodingService;

    public ReunionService(
            ReunionRepository reunionRepository,
            UtilisateurRepository utilisateurRepository,
            NotificationService notificationService,
            GeocodingService geocodingService) {

        this.reunionRepository = reunionRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.notificationService = notificationService;
        this.geocodingService = geocodingService;
    }

    public String creerReunion(ReunionRequest request) {

        Reunion reunion = new Reunion();
        reunion.setTitre(request.getTitre());
        reunion.setLieu(request.getLieu());
        reunion.setRayonKm(request.getRayonKm());
        reunion.setDateReunion(request.getDateReunion());
        reunion.setDescription(request.getDescription());

        /*
         * Résolution en arrière-plan des coordonnées GPS à partir
         * du lieu saisi librement par le chef de service, pour
         * pouvoir vérifier la zone au moment du pointage.
         */
        double[] coordonnees = geocodingService.obtenirCoordonnees(request.getLieu());

        if (coordonnees != null) {
            reunion.setLatitude(coordonnees[0]);
            reunion.setLongitude(coordonnees[1]);
        }

        /*
         * Récupération et association des participants
         */
        List<Utilisateur> participants = new ArrayList<>();

        if (request.getParticipantIds() != null
                && !request.getParticipantIds().isEmpty()) {

            for (Long id : request.getParticipantIds()) {

                utilisateurRepository.findById(id)
                        .ifPresent(participants::add);
            }
        }

        reunion.setParticipants(participants);

        reunionRepository.save(reunion);

        /*
         * Notification à chaque participant
         */
        for (Utilisateur participant : participants) {

            notificationService.creerNotification(
                    participant,
                    "Nouvelle réunion",
                    "Vous êtes invité à une réunion."
            );
        }

        return "Réunion créée avec succès";
    }

    /*
     * Supprime une réunion et prévient les participants : sans
     * cela, ils continueraient de l'attendre.
     */
    public String supprimerReunion(Long reunionId) {

        Reunion reunion =
                reunionRepository.findById(reunionId).orElse(null);

        if (reunion == null) {
            return "Réunion introuvable";
        }

        for (Utilisateur participant : reunion.getParticipants()) {

            notificationService.creerNotification(
                    participant,
                    "Réunion annulée",
                    "La réunion « " + reunion.getTitre() + " » a été annulée."
            );
        }

        reunionRepository.delete(reunion);

        return "Réunion supprimée avec succès";
    }
}