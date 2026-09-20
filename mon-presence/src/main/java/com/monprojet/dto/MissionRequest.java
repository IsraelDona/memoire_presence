package com.monprojet.dto;

import java.time.LocalDateTime;
import java.util.List;

public class MissionRequest {

    private String titre;
    private String lieu;
    private Double rayonKm;
    private LocalDateTime dateMission;
    private String description;

    /*
     * IDs des agents participants
     */
    private List<Long> participantIds;

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getLieu() { return lieu; }
    public void setLieu(String lieu) { this.lieu = lieu; }

    public Double getRayonKm() { return rayonKm; }
    public void setRayonKm(Double rayonKm) { this.rayonKm = rayonKm; }

    public LocalDateTime getDateMission() { return dateMission; }
    public void setDateMission(LocalDateTime dateMission) {
        this.dateMission = dateMission;
    }

    public String getDescription() { return description; }
    public void setDescription(String description) {
        this.description = description;
    }

    public List<Long> getParticipantIds() { return participantIds; }
    public void setParticipantIds(List<Long> participantIds) {
        this.participantIds = participantIds;
    }
}