package com.monprojet.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.monprojet.entity.Utilisateur;
import com.monprojet.service.DirecteurService;

@RestController
@RequestMapping("/api/directeur")
public class DirecteurController {

    private final DirecteurService directeurService;

    public DirecteurController(
            DirecteurService directeurService) {

        this.directeurService = directeurService;
    }

    /*
     * Liste des chefs de service actifs.
     */
    @GetMapping("/chefs")
    public ResponseEntity<List<Utilisateur>> getChefsService() {

        return ResponseEntity.ok(
                directeurService.getChefsService()
        );
    }

}
