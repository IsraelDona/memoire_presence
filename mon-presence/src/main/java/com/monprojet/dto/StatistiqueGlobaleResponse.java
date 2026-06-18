
package com.monprojet.dto;

public class StatistiqueGlobaleResponse {

    private long nombreAgents;

    private long nombrePresences;

    private long nombreRetards;

    private long nombreAnalysesIA;

    private long nombreJustificatifs;

    private long nombreMissions;

    private long nombreReunions;

    private double scoreGlobalPonctualite;

    public StatistiqueGlobaleResponse() {
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

    public long getNombreAnalysesIA() {
        return nombreAnalysesIA;
    }

    public void setNombreAnalysesIA(long nombreAnalysesIA) {
        this.nombreAnalysesIA = nombreAnalysesIA;
    }

    public long getNombreJustificatifs() {
        return nombreJustificatifs;
    }

    public void setNombreJustificatifs(long nombreJustificatifs) {
        this.nombreJustificatifs = nombreJustificatifs;
    }

    public long getNombreMissions() {
        return nombreMissions;
    }

    public void setNombreMissions(long nombreMissions) {
        this.nombreMissions = nombreMissions;
    }

    public long getNombreReunions() {
        return nombreReunions;
    }

    public void setNombreReunions(long nombreReunions) {
        this.nombreReunions = nombreReunions;
    }

    public double getScoreGlobalPonctualite() {
        return scoreGlobalPonctualite;
    }

    public void setScoreGlobalPonctualite(
            double scoreGlobalPonctualite) {

        this.scoreGlobalPonctualite =
                scoreGlobalPonctualite;
    }
}