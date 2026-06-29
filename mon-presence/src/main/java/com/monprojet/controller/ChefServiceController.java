package com.monprojet.controller;

import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.monprojet.dto.MissionRequest;
import com.monprojet.dto.ReunionRequest;
import com.monprojet.entity.Justificatif;
import com.monprojet.entity.Mission;
import com.monprojet.entity.Presence;
import com.monprojet.entity.Reunion;
import com.monprojet.entity.Utilisateur;
import com.monprojet.repository.JustificatifRepository;
import com.monprojet.repository.MissionRepository;
import com.monprojet.repository.PresenceRepository;
import com.monprojet.repository.ReunionRepository;
import com.monprojet.repository.UtilisateurRepository;
import com.monprojet.service.MissionService;
import com.monprojet.service.ReunionService;

@RestController
@RequestMapping("/api/chef-service")
public class ChefServiceController {

    private final PresenceRepository presenceRepository;
    private final JustificatifRepository justificatifRepository;
    private final MissionRepository missionRepository;
    private final ReunionRepository reunionRepository;
    private final MissionService missionService;
    private final ReunionService reunionService;
    private final UtilisateurRepository utilisateurRepository;

    public ChefServiceController(
            PresenceRepository presenceRepository,
            JustificatifRepository justificatifRepository,
            MissionRepository missionRepository,
            ReunionRepository reunionRepository,
            MissionService missionService,
            ReunionService reunionService,
            UtilisateurRepository utilisateurRepository) {
        this.presenceRepository = presenceRepository;
        this.justificatifRepository = justificatifRepository;
        this.missionRepository = missionRepository;
        this.reunionRepository = reunionRepository;
        this.missionService = missionService;
        this.reunionService = reunionService;
        this.utilisateurRepository = utilisateurRepository;
    }

    private Utilisateur getChefConnecte(Authentication authentication) {
        return utilisateurRepository
                .findByEmail(authentication.getName())
                .orElseThrow();
    }

    /*
     * Présences agents — uniquement ceux du même service que le chef connecté
     */
    @GetMapping("/presences-agents")
    public List<Presence> getPresencesAgents(Authentication authentication) {
        Utilisateur chef = getChefConnecte(authentication);

        if (chef.getService() == null) {
            return List.of();
        }

        return presenceRepository.findByUtilisateurServiceId(
                chef.getService().getId()
        );
    }

    /*
     * Agents du service du chef connecté
     * (utile pour les listes déroulantes mission/réunion)
     */
    @GetMapping("/agents")
    public List<Utilisateur> getAgentsDuService(Authentication authentication) {
        Utilisateur chef = getChefConnecte(authentication);

        if (chef.getService() == null) {
            return List.of();
        }

        return utilisateurRepository.findByServiceId(chef.getService().getId());
    }

    /*
     * Justificatifs
     */
    @GetMapping("/justificatifs")
    public List<Justificatif> getJustificatifs() {
        return justificatifRepository.findAll();
    }

    /*
     * Missions
     */
    @GetMapping("/missions")
    public List<Mission> getMissions() {
        return missionRepository.findAll();
    }

    @PostMapping("/missions")
    public String creerMission(
            @RequestBody MissionRequest request) {
        return missionService.creerMission(request);
    }

    /*
     * Réunions
     */
    @GetMapping("/reunions")
    public List<Reunion> getReunions() {
        return reunionRepository.findAll();
    }

    @PostMapping("/reunions")
    public String creerReunion(
            @RequestBody ReunionRequest request) {
        return reunionService.creerReunion(request);
    }
}