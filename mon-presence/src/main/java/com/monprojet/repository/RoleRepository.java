package com.monprojet.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.monprojet.entity.Role;
import com.monprojet.enums.RoleName;

/*
 * Repository JPA des rôles
 */
public interface RoleRepository
        extends JpaRepository<Role, Long> {

    /*
     * Recherche un rôle par son nom
     */
    Optional<Role> findByNomRole(RoleName nomRole);

}