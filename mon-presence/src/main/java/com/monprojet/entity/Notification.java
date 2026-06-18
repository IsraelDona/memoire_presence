package com.monprojet.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    @Column(length = 1000)
    private String message;

    private boolean lu = false;

    private LocalDateTime dateNotification;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    public Notification() {
    }

    public Long getId() {
        return id;
    }

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isLu() {
        return lu;
    }

    public void setLu(boolean lu) {
        this.lu = lu;
    }

    public LocalDateTime getDateNotification() {
        return dateNotification;
    }

    public void setDateNotification(
            LocalDateTime dateNotification) {
        this.dateNotification = dateNotification;
    }

    public Utilisateur getUtilisateur() {
        return utilisateur;
    }

    public void setUtilisateur(
            Utilisateur utilisateur) {
        this.utilisateur = utilisateur;
    }
}