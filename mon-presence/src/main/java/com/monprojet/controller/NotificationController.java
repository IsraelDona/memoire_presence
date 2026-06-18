package com.monprojet.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.monprojet.entity.Notification;
import com.monprojet.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService
            notificationService;

    public NotificationController(
            NotificationService notificationService) {

        this.notificationService =
                notificationService;
    }

    @GetMapping("/mes")
    public List<Notification>
    mesNotifications() {

        return notificationService
                .getMesNotifications();
    }

    @PutMapping("/{id}/lire")
    public String lireNotification(
            @PathVariable Long id) {

        return notificationService
                .marquerCommeLue(id);
    }
}