package com.monprojet.repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.monprojet.entity.AnalyseIA;
import com.monprojet.entity.Utilisateur;


public interface AnalyseIARepository
        extends JpaRepository<AnalyseIA, Long> {

    List<AnalyseIA>
    findByUtilisateurOrderByDateAnalyseDesc(
            Utilisateur utilisateur
    );
    List<AnalyseIA>
    findByUtilisateurIdOrderByDateAnalyseDesc(
            Long utilisateurId
    );
    Optional<AnalyseIA>
    findFirstByUtilisateurIdAndDateAnalyseBetween(
            Long utilisateurId,
            LocalDateTime debut,
            LocalDateTime fin
    );
}