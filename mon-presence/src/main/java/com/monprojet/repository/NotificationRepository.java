package com.monprojet.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.monprojet.entity.Notification;
import com.monprojet.entity.Utilisateur;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification>
    findByUtilisateurOrderByDateNotificationDesc(
            Utilisateur utilisateur
    );
    long countByUtilisateurAndLuFalse(
            Utilisateur utilisateur
    );
}