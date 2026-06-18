package com.monprojet.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.monprojet.dto.CreateChefServiceRequest;
import com.monprojet.dto.ValidationCompteRequest;
import com.monprojet.entity.Utilisateur;
import com.monprojet.service.AdminService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin("*")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {

        this.adminService = adminService;
    }

    /*
     * Voir toutes les demandes comptes agents
     */
    @GetMapping("/demandes-comptes")
    public List<Utilisateur> getDemandesComptes() {

        return adminService.getDemandesComptes();
    }

    /*
     * Validation ou refus compte agent
     */
    @PostMapping("/traiter-demande")
    public String traiterDemandeCompte(
            @RequestBody ValidationCompteRequest request) {

        return adminService.traiterDemandeCompte(request);
    }

    /*
     * Création chef service
     */
    @PostMapping("/creer-chef-service")
    public String creerChefService(
            @RequestBody CreateChefServiceRequest request) {

        return adminService.creerChefService(request);
    }
}