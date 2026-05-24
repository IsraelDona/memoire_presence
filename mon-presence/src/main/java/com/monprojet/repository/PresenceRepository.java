package com.monprojet.repository;
import java.util.List;
import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.monprojet.entity.Presence;
import com.monprojet.entity.Utilisateur;

public interface PresenceRepository
        extends JpaRepository<Presence, Long> {

    /*
     * Vérifier si utilisateur a déjà pointé aujourd'hui
     */
    Optional<Presence> findByUtilisateurAndDatePresence(
            Utilisateur utilisateur,
            LocalDate datePresence
    );
    /*
     * Historique d'un utilisateur
     */
    List<Presence> findByUtilisateurOrderByDatePresenceDesc(
            Utilisateur utilisateur
    );

    /*
     * Toutes les présences
     */
    List<Presence> findAllByOrderByDatePresenceDesc();
}