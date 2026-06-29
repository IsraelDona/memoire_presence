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

    public ReunionService(
            ReunionRepository reunionRepository,
            UtilisateurRepository utilisateurRepository,
            NotificationService notificationService) {

        this.reunionRepository = reunionRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.notificationService = notificationService;
    }

    public String creerReunion(ReunionRequest request) {

        Reunion reunion = new Reunion();
        reunion.setTitre(request.getTitre());
        reunion.setLieu(request.getLieu());
        reunion.setDateReunion(request.getDateReunion());
        reunion.setDescription(request.getDescription());

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
}