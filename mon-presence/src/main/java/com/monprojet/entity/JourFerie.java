package com.monprojet.entity;

import java.time.LocalDate;

import jakarta.persistence.*;

/*
 * Jour férié chômé déclaré par l'administration.
 *
 * Les fêtes à date fixe et les fêtes chrétiennes mobiles se
 * calculent (voir JoursFeriesService). Cette table sert aux fêtes
 * musulmanes, dont la date dépend de l'observation lunaire et n'est
 * confirmée que par communiqué officiel, ainsi qu'aux journées
 * chômées exceptionnelles décrétées par le gouvernement.
 */
@Entity
@Table(
    name = "jours_feries",
    uniqueConstraints = { @UniqueConstraint(columnNames = "date_ferie") }
)
public class JourFerie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_ferie", nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String libelle;

    public JourFerie() {
    }

    public JourFerie(LocalDate date, String libelle) {
        this.date = date;
        this.libelle = libelle;
    }

    public Long getId() {
        return id;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getLibelle() {
        return libelle;
    }

    public void setLibelle(String libelle) {
        this.libelle = libelle;
    }
}
