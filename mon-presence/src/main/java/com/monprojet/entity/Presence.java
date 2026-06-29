package com.monprojet.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.monprojet.enums.StatutPresence;
import com.monprojet.enums.TypePresence;

import jakarta.persistence.*;

@Entity
@Table(name = "presences")
public class Presence {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/*
	 * Date du pointage
	 */
	private LocalDate datePresence;

	/*
	 * Heure exacte du pointage
	 */
	private LocalDateTime heurePointage;

	/*
	 * Latitude GPS
	 */
	private Double latitude;

	/*
	 * Longitude GPS
	 */
	private Double longitude;

	/*
	 * Nom du lieu lisible, déterminé par géocodage
	 * inversé au moment du pointage (ex: "Akpakpa, Cotonou")
	 */
	@Column(length = 500)
	private String nomLieu;
	

	/*
	 * Statut présence PRESENT / RETARD / ABSENT
	 */
	@Enumerated(EnumType.STRING)
	private StatutPresence statutPresence;

	/*
	 * Type présence BUREAU / MISSION / REUNION
	 */
	@Enumerated(EnumType.STRING)
	private TypePresence typePresence;

	/*
	 * Agent concerné
	 */
	@ManyToOne
	@JoinColumn(name = "utilisateur_id")
	private Utilisateur utilisateur;

	public Presence() {
	}

	public Long getId() {
		return id;
	}

	public LocalDate getDatePresence() {
		return datePresence;
	}

	public void setDatePresence(LocalDate datePresence) {
		this.datePresence = datePresence;
	}

	public LocalDateTime getHeurePointage() {
		return heurePointage;
	}

	public void setHeurePointage(LocalDateTime heurePointage) {
		this.heurePointage = heurePointage;
	}

	public Double getLatitude() {
		return latitude;
	}

	public void setLatitude(Double latitude) {
		this.latitude = latitude;
	}

	public Double getLongitude() {
	    return longitude;
	}

	public void setLongitude(Double longitude) {
	    this.longitude = longitude;
	}

	public String getNomLieu() {
	    return nomLieu;
	}

	public void setNomLieu(String nomLieu) {
	    this.nomLieu = nomLieu;
	}
	

	public StatutPresence getStatutPresence() {
		return statutPresence;
	}

	public void setStatutPresence(StatutPresence statutPresence) {

		this.statutPresence = statutPresence;
	}

	public TypePresence getTypePresence() {
		return typePresence;
	}

	public void setTypePresence(TypePresence typePresence) {

		this.typePresence = typePresence;
	}

	public Utilisateur getUtilisateur() {
		return utilisateur;
	}

	public void setUtilisateur(Utilisateur utilisateur) {

		this.utilisateur = utilisateur;
	}
}