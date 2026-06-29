package com.monprojet.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;

@Entity
@Table(name = "missions")
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    private String lieu;

    private LocalDateTime dateMission;

    @Column(columnDefinition = "TEXT")
    private String description;

    /*
     * Relation ManyToMany :
     * une mission peut avoir plusieurs agents
     * un agent peut être dans plusieurs missions
     */
    @ManyToMany
    @JoinTable(
        name = "mission_participants",
        joinColumns = @JoinColumn(name = "mission_id"),
        inverseJoinColumns = @JoinColumn(name = "utilisateur_id")
    )
    private List<Utilisateur> participants = new ArrayList<>();

    public Mission() {}

    public Long getId() { return id; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getLieu() { return lieu; }
    public void setLieu(String lieu) { this.lieu = lieu; }

    public LocalDateTime getDateMission() { return dateMission; }
    public void setDateMission(LocalDateTime dateMission) {
        this.dateMission = dateMission;
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