package com.monprojet.service;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.monprojet.entity.Utilisateur;
import com.monprojet.repository.UtilisateurRepository;

@Component
public class AnalyseIAScheduler {

    private final UtilisateurRepository utilisateurRepository;
    private final AnalyseIAService analyseIAService;

    public AnalyseIAScheduler(
            UtilisateurRepository utilisateurRepository,
            AnalyseIAService analyseIAService) {

        this.utilisateurRepository = utilisateurRepository;
        this.analyseIAService = analyseIAService;
    }

    /*
     * S'exécute chaque jour à 23h00.
     * Garantit qu'une analyse existe pour chaque utilisateur actif,
     * même les jours sans pointage (pour capter les absences
     * dans le calcul de tendance et de série).
     */
    @Scheduled(cron = "0 0 23 * * *")
    public void genererAnalysesQuotidiennes() {

        List<Utilisateur> utilisateursActifs =
                utilisateurRepository.findByActifTrue();

        for (Utilisateur utilisateur : utilisateursActifs) {
            try {
                analyseIAService.genererAnalyse(utilisateur.getId());
            } catch (Exception e) {
                System.err.println(
                        "Erreur génération analyse IA quotidienne pour utilisateur "
                                + utilisateur.getId() + " : " + e.getMessage());
            }
        }
    }
}