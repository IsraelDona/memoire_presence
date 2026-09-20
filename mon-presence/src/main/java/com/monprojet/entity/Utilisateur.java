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

    @ManyToOne
    @JoinColumn(name = "service_id")
    private Service service;

    @Column(name = "photo_profil", columnDefinition = "TEXT")
    private String photoProfil;

    /*
     * Attributs propres à chaque rôle du diagramme de classes.
     * Tous nullables : un agent n'a pas de niveau d'accès, un
     * administrateur n'a pas de matricule.
     */

    /* Agent */
    private String matricule;
    private String grade;

    /* Agent et Directeur */
    private String poste;

    /* Administrateur */
    private String niveauAcces;

    private java.time.LocalDate dateDebutCycleAnalyse;

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

    public Service getService() {
        return service;
    }

    public void setService(Service service) {
        this.service = service;
    }

    
    public String getPhotoProfil() {
        return photoProfil;
    }

    public void setPhotoProfil(String photoProfil) {
        this.photoProfil = photoProfil;
    }
    
    public String getMatricule() {
        return matricule;
    }

    public void setMatricule(String matricule) {
        this.matricule = matricule;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public String getPoste() {
        return poste;
    }

    public void setPoste(String poste) {
        this.poste = poste;
    }

    public String getNiveauAcces() {
        return niveauAcces;
    }

    public void setNiveauAcces(String niveauAcces) {
        this.niveauAcces = niveauAcces;
    }

    public java.time.LocalDate getDateDebutCycleAnalyse() {
        return dateDebutCycleAnalyse;
    }
    public void setDateDebutCycleAnalyse(java.time.LocalDate dateDebutCycleAnalyse) {
        this.dateDebutCycleAnalyse = dateDebutCycleAnalyse;
    }

}