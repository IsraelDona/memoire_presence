package com.monprojet.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;

@Entity
@Table(name = "reunions")
public class Reunion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    private String lieu;

    private LocalDateTime dateReunion;

    @Column(length = 3000)
    private String description;

    /*
     * Relation ManyToMany :
     * une réunion peut avoir plusieurs participants
     * un agent peut être dans plusieurs réunions
     */
    @ManyToMany
    @JoinTable(
        name = "reunion_participants",
        joinColumns = @JoinColumn(name = "reunion_id"),
        inverseJoinColumns = @JoinColumn(name = "utilisateur_id")
    )
    private List<Utilisateur> participants = new ArrayList<>();

    public Reunion() {}

    public Long getId() { return id; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getLieu() { return lieu; }
    public void setLieu(String lieu) { this.lieu = lieu; }

    public LocalDateTime getDateReunion() { return dateReunion; }
    public void setDateReunion(LocalDateTime dateReunion) {
        this.dateReunion = dateReunion;
    }

    public String getDescription() { return description; }
    public void setDescription(String description) {
        this.description = description;
    }

    public List<Utilisateur> getParticipants() { return participants; }
    public void setParticipants(List<Utilisateur> participants) {
        this.participants = participants;
    }
}