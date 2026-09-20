package com.monprojet.dto;

import com.monprojet.enums.TypePresence;

/*
 * Contexte de pointage du jour pour un agent : le type de présence
 * et le lieu de référence qui s'appliquent aujourd'hui.
 *
 * L'agent ne choisit plus son type de pointage : s'il a été inscrit
 * à une mission ou à une réunion ce jour-là, le type et le lieu de
 * référence en découlent automatiquement. Sinon, c'est le bureau et
 * le périmètre défini par l'administrateur.
 */
public class ContextePointageResponse {

    private TypePresence typePresence;
    private String nomLieu;
    private Double latitude;
    private Double longitude;
    private Double rayonKm;

    /*
     * Intitulé de la mission ou de la réunion, pour que l'agent
     * comprenne pourquoi son lieu de référence a changé.
     */
    private String motif;

    public ContextePointageResponse() {
    }

    public TypePresence getTypePresence() { return typePresence; }
    public void setTypePresence(TypePresence typePresence) { this.typePresence = typePresence; }

    public String getNomLieu() { return nomLieu; }
    public void setNomLieu(String nomLieu) { this.nomLieu = nomLieu; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getRayonKm() { return rayonKm; }
    public void setRayonKm(Double rayonKm) { this.rayonKm = rayonKm; }

    public String getMotif() { return motif; }
    public void setMotif(String motif) { this.motif = motif; }
}
