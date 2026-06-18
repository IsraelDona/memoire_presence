package com.monprojet.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.monprojet.dto.MissionRequest;
import com.monprojet.dto.ReunionRequest;
import com.monprojet.entity.Justificatif;
import com.monprojet.entity.Mission;
import com.monprojet.entity.Presence;
import com.monprojet.entity.Reunion;
import com.monprojet.repository.JustificatifRepository;
import com.monprojet.repository.MissionRepository;
import com.monprojet.repository.PresenceRepository;
import com.monprojet.repository.ReunionRepository;
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

    public ChefServiceController(
            PresenceRepository presenceRepository,
            JustificatifRepository justificatifRepository,
            MissionRepository missionRepository,
            ReunionRepository reunionRepository,
            MissionService missionService,
            ReunionService reunionService) {

        this.presenceRepository = presenceRepository;
        this.justificatifRepository = justificatifRepository;
        this.missionRepository = missionRepository;
        this.reunionRepository = reunionRepository;
        this.missionService = missionService;
        this.reunionService = reunionService;
    }

    /*
     * Présences agents
     */
    @GetMapping("/presences-agents")
    public List<Presence> getPresencesAgents() {

        return presenceRepository.findAll();
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