package com.monprojet.repository;
import java.util.List;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.monprojet.entity.Presence;
import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.StatutPresence;
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
    
    long countByStatutPresence(
            StatutPresence statutPresence
    );

    long countByUtilisateur(
            Utilisateur utilisateur
    );

    long countByUtilisateurAndStatutPresence(
            Utilisateur utilisateur,
            StatutPresence statutPresence
    );
    @org.springframework.data.jpa.repository.Query(
    	    "SELECT FUNCTION('TO_CHAR', p.datePresence, 'YYYY-MM') as mois, " +
    	    "COUNT(p) as total, " +
    	    "SUM(CASE WHEN p.statutPresence = 'RETARD' THEN 1 ELSE 0 END) as retards " +
    	    "FROM Presence p " +
    	    "GROUP BY FUNCTION('TO_CHAR', p.datePresence, 'YYYY-MM') " +
    	    "ORDER BY mois ASC"
    	)
    	List<Object[]> getStatistiquesParMois();
    	
    	long countByUtilisateurAndDatePresence(
    	        Utilisateur utilisateur,
    	        LocalDate datePresence
    	);
    	List<Presence> findByUtilisateurServiceId(Long serviceId);
}