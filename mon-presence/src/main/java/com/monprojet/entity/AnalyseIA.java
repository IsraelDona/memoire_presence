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
    private boolean analyseComplete;
    private int joursCollectes;

    /*
     * Détail du cycle : ces compteurs sont conservés pour que le
     * score soit explicable, que les conseils puissent nommer
     * précisément ce qui pose problème, et que les statistiques
     * globales disposent d'un nombre d'absences fiable (une absence
     * n'ayant aucune ligne de présence, elle ne peut pas se compter
     * autrement).
     */
    /*
     * La valeur par defaut est indispensable : ces colonnes sont
     * ajoutees a une table deja remplie, et une contrainte NOT NULL
     * sans defaut ferait echouer la migration sur les lignes
     * existantes. Les anciennes analyses sont donc remises a zero.
     */
    @Column(nullable = false, columnDefinition = "integer default 0")
    private int nombrePresences;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private int nombreRetards;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private int nombreAbsences;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private int nombreJoursJustifies;
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
    
    public boolean isAnalyseComplete() {
        return analyseComplete;
    }
    public void setAnalyseComplete(boolean analyseComplete) {
        this.analyseComplete = analyseComplete;
    }
    public int getJoursCollectes() {
        return joursCollectes;
    }
    public void setJoursCollectes(int joursCollectes) {
        this.joursCollectes = joursCollectes;
    }

    public int getNombrePresences() {
        return nombrePresences;
    }
    public void setNombrePresences(int nombrePresences) {
        this.nombrePresences = nombrePresences;
    }

    public int getNombreRetards() {
        return nombreRetards;
    }
    public void setNombreRetards(int nombreRetards) {
        this.nombreRetards = nombreRetards;
    }

    public int getNombreAbsences() {
        return nombreAbsences;
    }
    public void setNombreAbsences(int nombreAbsences) {
        this.nombreAbsences = nombreAbsences;
    }

    public int getNombreJoursJustifies() {
        return nombreJoursJustifies;
    }
    public void setNombreJoursJustifies(int nombreJoursJustifies) {
        this.nombreJoursJustifies = nombreJoursJustifies;
    }
}