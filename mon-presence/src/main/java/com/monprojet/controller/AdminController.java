package com.monprojet.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.monprojet.dto.AffecterServiceRequest;
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

    /*
     * Liste des agents actifs, pour l'affectation à un service
     */
    @GetMapping("/agents")
    public List<Utilisateur> getTousLesAgents() {

        return adminService.getTousLesAgents();
    }

    /*
     * Affecter un agent à un autre service
     */
    @PostMapping("/affecter-service")
    public String affecterAgentAService(
            @RequestBody AffecterServiceRequest request) {

        return adminService.affecterAgentAService(
                request.getAgentId(),
                request.getServiceId());
    }

    /*
     * Informations administratives d'un agent (matricule, poste, grade)
     */
    @PostMapping("/agent-infos")
    public String mettreAJourInfosAgent(
            @RequestBody com.monprojet.dto.InfosAgentRequest request) {

        return adminService.mettreAJourInfosAgent(request);
    }

    /*
     * Historique des affectations d'un agent
     */
    @GetMapping("/agents/{agentId}/affectations")
    public List<com.monprojet.entity.Affectation> getHistoriqueAffectations(
            @PathVariable Long agentId) {

        return adminService.getHistoriqueAffectations(agentId);
    }
}