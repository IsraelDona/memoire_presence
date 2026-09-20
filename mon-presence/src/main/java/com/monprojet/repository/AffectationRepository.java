package com.monprojet.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.monprojet.entity.Affectation;
import com.monprojet.entity.Utilisateur;

public interface AffectationRepository
        extends JpaRepository<Affectation, Long> {

    List<Affectation> findByUtilisateurOrderByDateDebutDesc(Utilisateur utilisateur);

    Optional<Affectation> findByUtilisateurAndActifTrue(Utilisateur utilisateur);
}
