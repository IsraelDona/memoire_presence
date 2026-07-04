package com.monprojet.dto;

public class ValidationCompteRequest {

    // ID de l'utilisateur à valider
    private Long utilisateurId;

    // true = accepter
    // false = refuser
    private boolean accepter;

    public ValidationCompteRequest() {
    }

    public Long getUtilisateurId() {
        return utilisateurId;
    }

    public void setUtilisateurId(Long utilisateurId) {
        this.utilisateurId = utilisateurId;
    }

    public boolean isAccepter() {
        return accepter;
    }

    public void setAccepter(boolean accepter) {
        this.accepter = accepter;
    }
}