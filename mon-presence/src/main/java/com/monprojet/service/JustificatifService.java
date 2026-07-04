package com.monprojet.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.monprojet.dto.JustificatifRequest;
import com.monprojet.dto.RefusJustificatifRequest;
import com.monprojet.entity.Justificatif;
import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.StatutJustificatif;
import com.monprojet.repository.JustificatifRepository;
import com.monprojet.repository.UtilisateurRepository;

@Service
public class JustificatifService {

    private final JustificatifRepository
            justificatifRepository;

    private final UtilisateurRepository
            utilisateurRepository;
    private final NotificationService notificationService;

    public JustificatifService(
            JustificatifRepository
                    justificatifRepository,
            UtilisateurRepository
                    utilisateurRepository,
                    NotificationService notificationService) {

        this.justificatifRepository =
                justificatifRepository;

        this.utilisateurRepository =
                utilisateurRepository;
        this.notificationService = notificationService;
    }

    public String envoyerJustificatif(
            JustificatifRequest request) {

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

        Justificatif justificatif =
                new Justificatif();

        justificatif.setTitre(
                request.getTitre());

        justificatif.setDescription(
                request.getDescription());

        justificatif.setDateCreation(
                LocalDateTime.now());

        justificatif.setUtilisateur(
                utilisateur);

        justificatifRepository.save(
                justificatif);

        notificationService.creerNotification(
                utilisateur,
                "Justificatif envoyé",
                "Votre justificatif a été transmis pour validation."
        );
        
        return "Justificatif envoyé";
    }

    public List<Justificatif>
    getMesJustificatifs() {

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

        return justificatifRepository
                .findByUtilisateurOrderByDateCreationDesc(
                        utilisateur
                );
    }

    public List<Justificatif>
    getTousLesJustificatifs() {

        return justificatifRepository
                .findAllByOrderByDateCreationDesc();
    }

    public String accepter(Long id) {

        Justificatif justificatif =
                justificatifRepository
                        .findById(id)
                        .orElse(null);

        if (justificatif == null) {
            return "Introuvable";
        }

        justificatif.setStatut(
                StatutJustificatif.ACCEPTE);

        justificatifRepository
                .save(justificatif);
        notificationService.creerNotification(
                justificatif.getUtilisateur(),
                "Justificatif accepté",
                "Votre justificatif a été accepté."
        );

        return "Justificatif accepté";
    }

    public String refuser(
            Long id,
            RefusJustificatifRequest request) {

        Justificatif justificatif =
                justificatifRepository
                        .findById(id)
                        .orElse(null);

        if (justificatif == null) {
            return "Introuvable";
        }

        justificatif.setStatut(
                StatutJustificatif.REFUSE);

        justificatif.setMotifRefus(
                request.getMotifRefus());

        justificatifRepository
                .save(justificatif);
        
        notificationService.creerNotification(
                justificatif.getUtilisateur(),
                "Justificatif refusé",
                "Votre justificatif a été refusé. Motif : "
                        + request.getMotifRefus()
        );

        return "Justificatif refusé";
    }
}