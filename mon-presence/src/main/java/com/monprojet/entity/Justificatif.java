package com.monprojet.entity;

import java.time.LocalDateTime;
import java.time.LocalDate;
import com.monprojet.enums.StatutJustificatif;
import com.monprojet.enums.TypeJustificatif;

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
    	@Enumerated(EnumType.STRING)
    	private TypeJustificatif type;

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
     * Début de la période concernée
     */
    private LocalDate dateDebut;

    /*
     * Fin de la période concernée
     */
    private LocalDate dateFin;

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

    public TypeJustificatif getType() {
        return type;
    }

    public void setType(TypeJustificatif type) {
        this.type = type;
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
    public LocalDate getDateDebut() {
        return dateDebut;
    }

    public void setDateDebut(LocalDate dateDebut) {
        this.dateDebut = dateDebut;
    }

    public LocalDate getDateFin() {
        return dateFin;
    }

    public void setDateFin(LocalDate dateFin) {
        this.dateFin = dateFin;
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