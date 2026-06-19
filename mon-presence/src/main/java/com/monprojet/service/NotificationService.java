package com.monprojet.service;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    private Utilisateur getUtilisateurConnecte() {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();
        String email =
                authentication.getName();
        return utilisateurRepository
                .findByEmail(email)
                .orElseThrow();
    }

    /*
     * Notifications utilisateur connecté
     */
    public List<Notification>
    getMesNotifications() {
        Utilisateur utilisateur =
                getUtilisateurConnecte();
        return notificationRepository
                .findByUtilisateurOrderByDateNotificationDesc(
                        utilisateur);
    }

    /*
     * Nombre de notifications non lues
     */
    public long getNombreNonLues() {
        Utilisateur utilisateur =
                getUtilisateurConnecte();
        return notificationRepository
                .countByUtilisateurAndLuFalse(
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

    /*
     * Supprimer toutes mes notifications
     */
    @Transactional
    public String supprimerToutesMesNotifications() {
        Utilisateur utilisateur =
                getUtilisateurConnecte();
        notificationRepository
                .deleteByUtilisateur(utilisateur);
        return "Notifications supprimées";
    }
}