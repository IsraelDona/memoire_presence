package com.monprojet.dto;

public class JustificatifRequest {

    private String titre;

    private String description;

    public JustificatifRequest() {
    }

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(
            String description) {

        this.description = description;
    }
}