package com.monprojet.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "journaux")
public class Journal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Date de l'action
     */
    private LocalDateTime dateAction;

    /*
     * Utilisateur ayant effectué l'action
     */
    private String utilisateur;

    /*
     * Action réalisée
     */
    private String action;

    /*
     * Catégorie de l'action
     */
    private String categorie;

    /*
     * Résultat de l'action
     */
    private String resultat;

    public Journal() {
    }

    public Long getId() {
        return id;
    }

    public LocalDateTime getDateAction() {
        return dateAction;
    }

    public void setDateAction(LocalDateTime dateAction) {
        this.dateAction = dateAction;
    }

    public String getUtilisateur() {
        return utilisateur;
    }

    public void setUtilisateur(String utilisateur) {
        this.utilisateur = utilisateur;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getCategorie() {
        return categorie;
    }

    public void setCategorie(String categorie) {
        this.categorie = categorie;
    }

    public String getResultat() {
        return resultat;
    }

    public void setResultat(String resultat) {
        this.resultat = resultat;
    }

}