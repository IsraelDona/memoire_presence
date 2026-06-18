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

    public MissionService(
            MissionRepository missionRepository,
            UtilisateurRepository utilisateurRepository,
            NotificationService notificationService) {

        this.missionRepository = missionRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.notificationService = notificationService;
    }

    public String creerMission(MissionRequest request) {

        Mission mission = new Mission();
        mission.setTitre(request.getTitre());
        mission.setLieu(request.getLieu());
        mission.setDateMission(request.getDateMission());
        mission.setDescription(request.getDescription());

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
}