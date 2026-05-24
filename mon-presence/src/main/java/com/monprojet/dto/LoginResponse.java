package com.monprojet.dto;

public class LoginResponse {

    private String token;
    private String role;
    private String nom;
    private String email;

    public LoginResponse() {
    }

    public LoginResponse(
            String token,
            String role,
            String nom,
            String email
    ) {
        this.token = token;
        this.role = role;
        this.nom = nom;
        this.email = email;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}