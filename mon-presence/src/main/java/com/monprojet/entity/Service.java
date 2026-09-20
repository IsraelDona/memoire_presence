package com.monprojet.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "services")
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nom;

    /*
     * On ignore "service" lors de la sérialisation du chef
     * pour éviter la boucle infinie utilisateur -> service ->
     * chefService -> service -> ...
     */
    @ManyToOne
    @JoinColumn(name = "chef_service_id")
    @JsonIgnoreProperties({"service"})
    private Utilisateur chefService;

    public Service() {
    }

    public Service(String nom) {
        this.nom = nom;
    }

    public Long getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public Utilisateur getChefService() {
        return chefService;
    }

    public void setChefService(
            Utilisateur chefService) {
        this.chefService = chefService;
    }
}
