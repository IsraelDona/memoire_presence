package com.monprojet.entity;

import com.monprojet.enums.RoleName;

import jakarta.persistence.*;

/*
 * Entité représentant les rôles :
 * ADMINISTRATEUR
 * CHEF_SERVICE
 * AGENT
 */
@Entity

/*
 * Table SQL : roles
 */
@Table(
    name = "roles",

    /*
     * Empêche doublons de rôles
     */
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "nom_role")
    }
)
public class Role {

    /*
     * Clé primaire
     */
    @Id

    /*
     * Auto incrémentation
     */
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Enum enregistré en texte
     */
    @Enumerated(EnumType.STRING)

    @Column(name = "nom_role", nullable = false, unique = true)
    private RoleName nomRole;

    /*
     * Constructeur vide obligatoire JPA
     */
    public Role() {
    }

    /*
     * Constructeur pratique
     */
    public Role(RoleName nomRole) {
        this.nomRole = nomRole;
    }

    public Long getId() {
        return id;
    }

    public RoleName getNomRole() {
        return nomRole;
    }

    public void setNomRole(RoleName nomRole) {
        this.nomRole = nomRole;
    }
}