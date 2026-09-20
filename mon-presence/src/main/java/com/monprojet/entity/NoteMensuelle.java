package com.monprojet.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "notes_mensuelles")
public class NoteMensuelle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mois concerné (ex: 2026-05-01 = mai 2026)
    private int mois;
    private int annee;

    // L'utilisateur évalué (agent ou chef)
    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    // Note automatique calculée par le système /20
    private Double noteAutomatique;

    // Note manuelle donnée par le chef (pour agent)
    // ou par l'admin (pour chef)
    private Double noteManuelle;

    // Score final = (noteAutomatique + noteManuelle) / 2
    private Double scoreFinal;

    // Note manuelle déjà saisie ?
    private boolean noteManuelleDefinie = false;

    // Date de la dernière mise à jour
    private LocalDate dateMiseAJour;

    public NoteMensuelle() {}

    public Long getId() { return id; }

    public int getMois() { return mois; }
    public void setMois(int mois) { this.mois = mois; }

    public int getAnnee() { return annee; }
    public void setAnnee(int annee) { this.annee = annee; }

    public Utilisateur getUtilisateur() { return utilisateur; }
    public void setUtilisateur(Utilisateur utilisateur) { this.utilisateur = utilisateur; }

    public Double getNoteAutomatique() { return noteAutomatique; }
    public void setNoteAutomatique(Double noteAutomatique) { this.noteAutomatique = noteAutomatique; }

    public Double getNoteManuelle() { return noteManuelle; }
    public void setNoteManuelle(Double noteManuelle) { this.noteManuelle = noteManuelle; }

    public Double getScoreFinal() { return scoreFinal; }
    public void setScoreFinal(Double scoreFinal) { this.scoreFinal = scoreFinal; }

    public boolean isNoteManuelleDefinie() { return noteManuelleDefinie; }
    public void setNoteManuelleDefinie(boolean noteManuelleDefinie) { this.noteManuelleDefinie = noteManuelleDefinie; }

    public LocalDate getDateMiseAJour() { return dateMiseAJour; }
    public void setDateMiseAJour(LocalDate dateMiseAJour) { this.dateMiseAJour = dateMiseAJour; }
}