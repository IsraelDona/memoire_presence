package com.monprojet.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

/*
 * Historique des rattachements d'un agent à un service.
 *
 * La colonne utilisateurs.service_id reste la source du service
 * courant (lecture rapide partout dans l'application) ; cette table
 * conserve en plus la trace de chaque période d'affectation, avec
 * une seule ligne active à la fois par agent.
 */
@Entity
@Table(name = "affectations")
public class Affectation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @ManyToOne
    @JoinColumn(name = "service_id")
    private Service service;

    private LocalDateTime dateDebut;

    /*
     * Reste null tant que l'affectation est en cours.
     */
    private LocalDateTime dateFin;

    private boolean actif = true;

    public Affectation() {
    }

    public Affectation(Utilisateur utilisateur, Service service, LocalDateTime dateDebut) {
        this.utilisateur = utilisateur;
        this.service = service;
        this.dateDebut = dateDebut;
        this.actif = true;
    }

    public Long getId() {
        return id;
    }

    public Utilisateur getUtilisateur() {
        return utilisateur;
    }

    public void setUtilisateur(Utilisateur utilisateur) {
        this.utilisateur = utilisateur;
    }

    public Service getService() {
        return service;
    }

    public void setService(Service service) {
        this.service = service;
    }

    public LocalDateTime getDateDebut() {
        return dateDebut;
    }

    public void setDateDebut(LocalDateTime dateDebut) {
        this.dateDebut = dateDebut;
    }

    public LocalDateTime getDateFin() {
        return dateFin;
    }

    public void setDateFin(LocalDateTime dateFin) {
        this.dateFin = dateFin;
    }

    public boolean isActif() {
        return actif;
    }

    public void setActif(boolean actif) {
        this.actif = actif;
    }
}
