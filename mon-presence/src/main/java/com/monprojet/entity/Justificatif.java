package com.monprojet.entity;

import java.time.LocalDateTime;

import com.monprojet.enums.StatutJustificatif;

import jakarta.persistence.*;

@Entity
@Table(name = "justificatifs")
public class Justificatif {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Sujet du justificatif
     * Exemple :
     * Absence maladie
     * Retard transport
     */
    private String titre;

    /*
     * Description / motif
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /*
     * Date d’envoi
     */
    private LocalDateTime dateCreation;

    /*
     * Accepté / refusé / attente
     */
    @Enumerated(EnumType.STRING)
    private StatutJustificatif statut =
            StatutJustificatif.EN_ATTENTE;

    /*
     * Motif du refus
     */
    @Column(columnDefinition = "TEXT")
    private String motifRefus;

    /*
     * Agent concerné
     */
    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    public Justificatif() {
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

    public String getDescription() {
        return description;
    }

    public void setDescription(
            String description) {

        this.description = description;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(
            LocalDateTime dateCreation) {

        this.dateCreation = dateCreation;
    }

    public StatutJustificatif getStatut() {
        return statut;
    }

    public void setStatut(
            StatutJustificatif statut) {

        this.statut = statut;
    }

    public String getMotifRefus() {
        return motifRefus;
    }

    public void setMotifRefus(
            String motifRefus) {

        this.motifRefus = motifRefus;
    }

    public Utilisateur getUtilisateur() {
        return utilisateur;
    }

    public void setUtilisateur(
            Utilisateur utilisateur) {

        this.utilisateur = utilisateur;
    }
}