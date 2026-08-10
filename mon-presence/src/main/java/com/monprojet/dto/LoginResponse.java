package com.monprojet.dto;

public class LoginResponse {

    private String token;
    private String role;
    private String nom;
    private String prenom;
    private String email;
    private boolean visageEnregistre;
    private String photoProfil;

    public LoginResponse() {
    }

    public LoginResponse(
            String token,
            String role,
            String nom,
            String prenom,
            String email,
            boolean visageEnregistre,
            String photoProfil
    ) {
        this.token = token;
        this.role = role;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.visageEnregistre = visageEnregistre;
        this.photoProfil = photoProfil;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isVisageEnregistre() {
        return visageEnregistre;
    }

    public void setVisageEnregistre(boolean visageEnregistre) {
        this.visageEnregistre = visageEnregistre;
    }

    public String getPhotoProfil() {
        return photoProfil;
    }

    public void setPhotoProfil(String photoProfil) {
        this.photoProfil = photoProfil;
    }
}