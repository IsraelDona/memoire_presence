package com.monprojet.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.monprojet.entity.Justificatif;
import com.monprojet.entity.Utilisateur;

public interface JustificatifRepository
        extends JpaRepository<Justificatif, Long> {

    List<Justificatif>
    findByUtilisateurOrderByDateCreationDesc(
            Utilisateur utilisateur
    );

    List<Justificatif>
    findAllByOrderByDateCreationDesc();
}