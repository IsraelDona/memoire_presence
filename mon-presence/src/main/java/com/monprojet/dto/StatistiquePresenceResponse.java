package com.monprojet.dto;

public class StatistiquePresenceResponse {

    private long nombrePresences;

    private long nombreRetards;

    private double tauxPresence;

    private double scorePonctualite;

    public StatistiquePresenceResponse() {
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

    public double getTauxPresence() {
        return tauxPresence;
    }

    public void setTauxPresence(double tauxPresence) {
        this.tauxPresence = tauxPresence;
    }

    public double getScorePonctualite() {
        return scorePonctualite;
    }

    public void setScorePonctualite(double scorePonctualite) {
        this.scorePonctualite = scorePonctualite;
    }
}