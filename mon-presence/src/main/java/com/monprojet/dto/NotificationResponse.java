package com.monprojet.dto;

import java.time.LocalDateTime;

public class NotificationResponse {

    private Long id;
    private String titre;
    private String message;
    private boolean lu;
    private LocalDateTime dateNotification;

    public NotificationResponse() {
    }

    public NotificationResponse(
            Long id,
            String titre,
            String message,
            boolean lu,
            LocalDateTime dateNotification) {

        this.id = id;
        this.titre = titre;
        this.message = message;
        this.lu = lu;
        this.dateNotification = dateNotification;
    }

    public Long getId() {
        return id;
    }

    public String getTitre() {
        return titre;
    }

    public String getMessage() {
        return message;
    }

    public boolean isLu() {
        return lu;
    }

    public LocalDateTime getDateNotification() {
        return dateNotification;
    }
}