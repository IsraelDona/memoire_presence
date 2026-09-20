package com.monprojet.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.monprojet.entity.Justificatif;
import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.StatutJustificatif;

public interface JustificatifRepository
        extends JpaRepository<Justificatif, Long> {

    List<Justificatif>
    findByUtilisateurOrderByDateCreationDesc(
            Utilisateur utilisateur);

    List<Justificatif> findAllByOrderByDateCreationDesc();
    List<Justificatif> findByUtilisateurServiceId(Long serviceId);

    @Query("SELECT j FROM Justificatif j LEFT JOIN FETCH j.utilisateur WHERE j.id = :id")
    Optional<Justificatif> findByIdWithUtilisateur(@Param("id") Long id);

    /*
     * Justificatifs acceptés qui chevauchent une période donnée
     * (utilisés par l'Analyse IA pour ne pas pénaliser une
     * absence couverte par un justificatif validé).
     */
    List<Justificatif> findByUtilisateurAndStatutAndDateFinGreaterThanEqual(
            Utilisateur utilisateur,
            StatutJustificatif statut,
            LocalDate dateFin);
}