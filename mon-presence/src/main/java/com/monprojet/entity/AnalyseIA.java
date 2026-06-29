package com.monprojet.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(name = "analyses_ia")
public class AnalyseIA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double scorePonctualite;
    private double tauxPresence;
    private String niveauRegularite;

    @Column(length = 1000)
    private String recommandation;

    @Column(length = 1000)
    private String conseil;

    private String badge;

    private int serieJours;

    private LocalDateTime dateAnalyse;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    public AnalyseIA() {
    }

    public Long getId() {
        return id;
    }

    public double getScorePonctualite() {
        return scorePonctualite;
    }

    public void setScorePonctualite(double scorePonctualite) {
        this.scorePonctualite = scorePonctualite;
    }

    public double getTauxPresence() {
        return tauxPresence;
    }

    public void setTauxPresence(double tauxPresence) {
        this.tauxPresence = tauxPresence;
    }

    public String getNiveauRegularite() {
        return niveauRegularite;
    }

    public void setNiveauRegularite(String niveauRegularite) {
        this.niveauRegularite = niveauRegularite;
    }

    public String getRecommandation() {
        return recommandation;
    }

    public void setRecommandation(String recommandation) {
        this.recommandation = recommandation;
    }

    public String getConseil() {
        return conseil;
    }

    public void setConseil(String conseil) {
        this.conseil = conseil;
    }

    public String getBadge() {
        return badge;
    }

    public void setBadge(String badge) {
        this.badge = badge;
    }

    public int getSerieJours() {
        return serieJours;
    }

    public void setSerieJours(int serieJours) {
        this.serieJours = serieJours;
    }

    public LocalDateTime getDateAnalyse() {
        return dateAnalyse;
    }

    public void setDateAnalyse(LocalDateTime dateAnalyse) {
        this.dateAnalyse = dateAnalyse;
    }

    public Utilisateur getUtilisateur() {
        return utilisateur;
    }

    public void setUtilisateur(Utilisateur utilisateur) {
        this.utilisateur = utilisateur;
    }
}