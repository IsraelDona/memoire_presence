package com.monprojet.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.monprojet.dto.MissionRequest;
import com.monprojet.entity.Mission;
import com.monprojet.entity.Utilisateur;
import com.monprojet.repository.MissionRepository;
import com.monprojet.repository.UtilisateurRepository;

@Service
public class MissionService {

    private final MissionRepository missionRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationService notificationService;
    private final GeocodingService geocodingService;

    public MissionService(
            MissionRepository missionRepository,
            UtilisateurRepository utilisateurRepository,
            NotificationService notificationService,
            GeocodingService geocodingService) {

        this.missionRepository = missionRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.notificationService = notificationService;
        this.geocodingService = geocodingService;
    }

    public String creerMission(MissionRequest request) {

        Mission mission = new Mission();
        mission.setTitre(request.getTitre());
        mission.setLieu(request.getLieu());
        mission.setRayonKm(request.getRayonKm());
        mission.setDateMission(request.getDateMission());
        mission.setDescription(request.getDescription());

        /*
         * Résolution en arrière-plan des coordonnées GPS à partir
         * du lieu saisi librement par le chef de service, pour
         * pouvoir vérifier la zone au moment du pointage.
         */
        double[] coordonnees = geocodingService.obtenirCoordonnees(request.getLieu());

        if (coordonnees != null) {
            mission.setLatitude(coordonnees[0]);
            mission.setLongitude(coordonnees[1]);
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

        mission.setParticipants(participants);

        missionRepository.save(mission);

        /*
         * Notification à chaque participant
         */
        for (Utilisateur participant : participants) {

            notificationService.creerNotification(
                    participant,
                    "Nouvelle mission",
                    "Une nouvelle mission vous a été attribuée."
            );
        }

        return "Mission créée avec succès";
    }

    /*
     * Supprime une mission et prévient les agents qui y étaient
     * affectés : sans cela, ils continueraient de l'attendre.
     */
    public String supprimerMission(Long missionId) {

        Mission mission =
                missionRepository.findById(missionId).orElse(null);

        if (mission == null) {
            return "Mission introuvable";
        }

        for (Utilisateur participant : mission.getParticipants()) {

            notificationService.creerNotification(
                    participant,
                    "Mission annulée",
                    "La mission « " + mission.getTitre() + " » a été annulée."
            );
        }

        missionRepository.delete(mission);

        return "Mission supprimée avec succès";
    }
}