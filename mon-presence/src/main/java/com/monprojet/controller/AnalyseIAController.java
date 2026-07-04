package com.monprojet.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.monprojet.entity.AnalyseIA;
import com.monprojet.entity.Utilisateur;
import com.monprojet.repository.UtilisateurRepository;
import com.monprojet.service.AnalyseIAService;

@RestController
@RequestMapping("/api/analyse-ia")
public class AnalyseIAController {

    private final AnalyseIAService analyseIAService;

    private final UtilisateurRepository utilisateurRepository;

    public AnalyseIAController(
            AnalyseIAService analyseIAService,
            UtilisateurRepository utilisateurRepository) {

        this.analyseIAService =
                analyseIAService;

        this.utilisateurRepository =
                utilisateurRepository;
    }

    /*
     * Générer analyse pour un utilisateur
     */
    @PostMapping("/{utilisateurId}")
    public AnalyseIA genererAnalyse(
            @PathVariable Long utilisateurId) {

        return analyseIAService
                .genererAnalyse(
                        utilisateurId);
    }

    /*
     * Historique analyses d'un utilisateur
     */
    @GetMapping("/{utilisateurId}")
    public List<AnalyseIA> historique(
            @PathVariable Long utilisateurId) {

        return analyseIAService
                .getAnalysesUtilisateur(
                        utilisateurId);
    }

    /*
     * Toutes les analyses
     */
    @GetMapping
    public List<AnalyseIA> toutes() {

        return analyseIAService
                .getToutesLesAnalyses();
    }

    /*
     * Mes analyses IA
     */
    @GetMapping("/me")
    public List<AnalyseIA> mesAnalyses(
            Authentication authentication) {

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(authentication.getName())
                        .orElseThrow();

        return analyseIAService
                .getAnalysesUtilisateur(
                        utilisateur.getId());
    }

    /*
     * Générer mon analyse IA
     */
		    @PostMapping("/me/generer")
		    public AnalyseIA genererMaAnalyse(
		            Authentication authentication) {
		
		        Utilisateur utilisateur =
		                utilisateurRepository
		                        .findByEmail(authentication.getName())
		                        .orElseThrow();
		
		        return analyseIAService
		                .genererAnalyse(
		                        utilisateur.getId());
		      }
    
}