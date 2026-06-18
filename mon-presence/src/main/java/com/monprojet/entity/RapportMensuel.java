package com.monprojet.entity;

import java.time.LocalDate;

import jakarta.persistence.*;

@Entity
@Table(name = "rapports_mensuels")
public class RapportMensuel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int mois;

    private int annee;

    private long nombreAgents;

    private long nombrePresences;

    private long nombreRetards;

    private double scoreMoyenPonctualite;

    private LocalDate dateGeneration;

    public RapportMensuel() {
    }

    public Long getId() {
        return id;
    }

    public int getMois() {
        return mois;
    }

    public void setMois(int mois) {
        this.mois = mois;
    }

    public int getAnnee() {
        return annee;
    }

    public void setAnnee(int annee) {
        this.annee = annee;
    }

    public long getNombreAgents() {
        return nombreAgents;
    }

    public void setNombreAgents(long nombreAgents) {
        this.nombreAgents = nombreAgents;
    }

    public long getNombrePresences() {
        return nombrePresences;
    }

    public void setNombrePresences(long nombrePresences) {
        this.nombrePresences = nombrePresences;
    }

    public long getNombreRetards() {
        return nombreRetards;
    }

    public void setNombreRetards(long nombreRetards) {
        this.nombreRetards = nombreRetards;
    }

    public double getScoreMoyenPonctualite() {
        return scoreMoyenPonctualite;
    }

    public void setScoreMoyenPonctualite(
            double scoreMoyenPonctualite) {
        this.scoreMoyenPonctualite =
                scoreMoyenPonctualite;
    }

    public LocalDate getDateGeneration() {
        return dateGeneration;
    }

    public void setDateGeneration(
            LocalDate dateGeneration) {
        this.dateGeneration =
                dateGeneration;
    }
}