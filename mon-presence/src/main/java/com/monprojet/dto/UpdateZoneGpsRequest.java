package com.monprojet.dto;

public class UpdateZoneGpsRequest {

    private Double latitude;
    private Double longitude;
    private Double rayonKm;
    private Integer nombrePointagesParJour;
    private Boolean modeTestSansZone;

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getRayonKm() { return rayonKm; }
    public void setRayonKm(Double rayonKm) { this.rayonKm = rayonKm; }

    public Integer getNombrePointagesParJour() { return nombrePointagesParJour; }
    public void setNombrePointagesParJour(Integer n) { this.nombrePointagesParJour = n; }

    public Boolean getModeTestSansZone() { return modeTestSansZone; }
    public void setModeTestSansZone(Boolean m) { this.modeTestSansZone = m; }
}