package com.monprojet.dto;

public class UpdateZoneGpsRequest {

    private Double latitude;
    private Double longitude;
    private Double rayonKm;

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getRayonKm() { return rayonKm; }
    public void setRayonKm(Double rayonKm) {
        this.rayonKm = rayonKm;
    }
}