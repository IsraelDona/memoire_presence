package com.monprojet.dto;
import java.time.LocalDate;
import com.monprojet.enums.TypeJustificatif;

public class JustificatifRequest {

	private TypeJustificatif type;

	private String description;

	private LocalDate dateDebut;

	private LocalDate dateFin;

    public JustificatifRequest() {
    }

    public TypeJustificatif getType() {
        return type;
    }

    public void setType(TypeJustificatif type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(
            String description) {

        this.description = description;
    }
    public LocalDate getDateDebut() {
        return dateDebut;
    }
    public void setDateDebut(LocalDate dateDebut) {
        this.dateDebut = dateDebut;
    }

    public LocalDate getDateFin() {
        return dateFin;
    }

    public void setDateFin(LocalDate dateFin) {
        this.dateFin = dateFin;
    }
}