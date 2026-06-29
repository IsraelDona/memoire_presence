package com.monprojet.dto;

public class EvolutionMensuelleDTO {

    private String mois;
    private double tauxPonctualite;

    public EvolutionMensuelleDTO() {
    }

    public EvolutionMensuelleDTO(String mois, double tauxPonctualite) {
        this.mois = mois;
        this.tauxPonctualite = tauxPonctualite;
    }

    public String getMois() {
        return mois;
    }

    public void setMois(String mois) {
        this.mois = mois;
    }

    public double getTauxPonctualite() {
        return tauxPonctualite;
    }

    public void setTauxPonctualite(double tauxPonctualite) {
        this.tauxPonctualite = tauxPonctualite;
    }
}