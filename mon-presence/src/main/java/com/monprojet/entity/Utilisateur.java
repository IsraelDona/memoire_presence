package com.monprojet.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;


@Entity
@Table(name = "utilisateurs")
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;

    private String prenom;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    private String motDePasse;

    /*
     * Compte validé par admin ?
     */
    private boolean actif = false;

    /*
     * Indique si le visage a déjà été enregistré
     */
    private boolean visageEnregistre = false;

    /*
     * Photo visage stockée en Base64
     */
    
    @Column(name = "photo_visage", columnDefinition = "TEXT")
    private String photoVisage;

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;
    
    @Column(name = "photo_profil", columnDefinition = "TEXT")
    private String photoProfil;

    public Utilisateur() {
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

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMotDePasse() {
        return motDePasse;
    }

    public void setMotDePasse(String motDePasse) {
        this.motDePasse = motDePasse;
    }

    public boolean isActif() {
        return actif;
    }

    public void setActif(boolean actif) {
        this.actif = actif;
    }

    public boolean isVisageEnregistre() {
        return visageEnregistre;
    }

    public void setVisageEnregistre(boolean visageEnregistre) {
        this.visageEnregistre = visageEnregistre;
    }

    public String getPhotoVisage() {
        return photoVisage;
    }

    public void setPhotoVisage(String photoVisage) {
        this.photoVisage = photoVisage;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
    
    public String getPhotoProfil() {
        return photoProfil;
    }

    public void setPhotoProfil(String photoProfil) {
        this.photoProfil = photoProfil;
    }
    
    
}