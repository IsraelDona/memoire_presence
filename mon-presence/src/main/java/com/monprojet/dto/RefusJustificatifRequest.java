package com.monprojet.dto;

public class RefusJustificatifRequest {

    private String motifRefus;

    public RefusJustificatifRequest() {
    }

    public String getMotifRefus() {
        return motifRefus;
    }

    public void setMotifRefus(
            String motifRefus) {

        this.motifRefus = motifRefus;
    }
}