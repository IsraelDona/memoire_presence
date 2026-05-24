package com.monprojet.dto;

import com.monprojet.enums.TypePresence;

public class PointageRequest {

    private Double latitude;

    private Double longitude;

    private TypePresence typePresence;

    public PointageRequest() {
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

    public TypePresence getTypePresence() {
        return typePresence;
    }

    public void setTypePresence(
            TypePresence typePresence) {

        this.typePresence = typePresence;
    }
}