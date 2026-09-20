package com.monprojet.repository;

import com.monprojet.entity.NoteMensuelle;
import com.monprojet.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NoteMensuelleRepository
        extends JpaRepository<NoteMensuelle, Long> {

    Optional<NoteMensuelle> findByUtilisateurAndMoisAndAnnee(
            Utilisateur utilisateur, int mois, int annee);

    List<NoteMensuelle> findByUtilisateurOrderByAnneeDescMoisDesc(
            Utilisateur utilisateur);

    // Agents d'un service pour un mois/annee.
    // Le chef de service est exclu : il est classe parmi les chefs,
    // pas parmi les agents qu'il encadre.
    @Query("SELECT n FROM NoteMensuelle n " +
           "JOIN n.utilisateur u " +
           "JOIN u.role r " +
           "WHERE u.service.id = :serviceId " +
           "AND r.nomRole = com.monprojet.enums.RoleName.AGENT " +
           "AND n.mois = :mois AND n.annee = :annee " +
           "ORDER BY n.noteAutomatique DESC NULLS LAST")
    List<NoteMensuelle> findClassementParService(
            @Param("serviceId") Long serviceId,
            @Param("mois") int mois,
            @Param("annee") int annee);

    // Classement global tous chefs services
    @Query("SELECT n FROM NoteMensuelle n " +
           "JOIN n.utilisateur u " +
           "JOIN u.role r " +
           "WHERE r.nomRole = com.monprojet.enums.RoleName.CHEF_SERVICE " +
           "AND n.mois = :mois AND n.annee = :annee " +
           "ORDER BY COALESCE(n.scoreFinal, n.noteAutomatique) DESC NULLS LAST")
    List<NoteMensuelle> findClassementChefs(
            @Param("mois") int mois,
            @Param("annee") int annee);

    // Classement global tous agents (pour admin)
    @Query("SELECT n FROM NoteMensuelle n " +
           "JOIN n.utilisateur u " +
           "JOIN u.role r " +
           "WHERE r.nomRole = com.monprojet.enums.RoleName.AGENT " +
           "AND n.mois = :mois AND n.annee = :annee " +
           "ORDER BY n.noteAutomatique DESC NULLS LAST")
    List<NoteMensuelle> findClassementAgents(
            @Param("mois") int mois,
            @Param("annee") int annee);
}