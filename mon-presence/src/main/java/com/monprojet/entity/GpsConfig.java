package com.monprojet.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "gps_config")
public class GpsConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nomLieu;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private Double rayonKm;

    /*
     * Nombre de pointages autorisés par jour (1 à 3)
     */
    @Column(nullable = false)
    private Integer nombrePointagesParJour = 1;

    /*
     * Mode test : désactive la vérification de zone GPS,
     * la vérification faciale reste obligatoire
     */
    @Column(nullable = false)
    private boolean modeTestSansZone = false;

    public GpsConfig() {
    }

    public GpsConfig(String nomLieu, Double latitude, Double longitude, Double rayonKm) {
        this.nomLieu = nomLieu;
        this.latitude = latitude;
        this.longitude = longitude;
        this.rayonKm = rayonKm;
    }

    public Long getId() {
        return id;
    }

    public String getNomLieu() {
        return nomLieu;
    }

    public void setNomLieu(String nomLieu) {
        this.nomLieu = nomLieu;
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

    public Double getRayonKm() {
        return rayonKm;
    }

    public void setRayonKm(Double rayonKm) {
        this.rayonKm = rayonKm;
    }

    public Integer getNombrePointagesParJour() {
        return nombrePointagesParJour;
    }

    public void setNombrePointagesParJour(Integer nombrePointagesParJour) {
        this.nombrePointagesParJour = nombrePointagesParJour;
    }

    public boolean isModeTestSansZone() {
        return modeTestSansZone;
    }

    public void setModeTestSansZone(boolean modeTestSansZone) {
        this.modeTestSansZone = modeTestSansZone;
    }
}
