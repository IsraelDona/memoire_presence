package com.monprojet.repository;

import java.util.List;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.RoleName;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Utilisateur> findByActifFalse();
    
    Optional<Utilisateur> findFirstByRoleNomRole(
            RoleName nomRole
    );
}
