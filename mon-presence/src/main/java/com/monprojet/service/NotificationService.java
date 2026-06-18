package com.monprojet.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.monprojet.entity.Notification;
import com.monprojet.entity.Utilisateur;
import com.monprojet.repository.NotificationRepository;
import com.monprojet.repository.UtilisateurRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    private final UtilisateurRepository utilisateurRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            UtilisateurRepository utilisateurRepository) {

        this.notificationRepository =
                notificationRepository;

        this.utilisateurRepository =
                utilisateurRepository;
    }

    /*
     * Créer notification
     */
    public void creerNotification(
            Utilisateur utilisateur,
            String titre,
            String message) {

        Notification notification =
                new Notification();

        notification.setUtilisateur(
                utilisateur);

        notification.setTitre(
                titre);

        notification.setMessage(
                message);

        notification.setDateNotification(
                LocalDateTime.now());

        notificationRepository.save(
                notification);
    }

    /*
     * Notifications utilisateur connecté
     */
    public List<Notification>
    getMesNotifications() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email =
                authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElseThrow();

        return notificationRepository
                .findByUtilisateurOrderByDateNotificationDesc(
                        utilisateur);
    }

    /*
     * Marquer notification comme lue
     */
    public String marquerCommeLue(
            Long id) {

        Notification notification =
                notificationRepository
                        .findById(id)
                        .orElseThrow();

        notification.setLu(true);

        notificationRepository.save(
                notification);

        return "Notification lue";
    }
}