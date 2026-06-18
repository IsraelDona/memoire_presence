package com.monprojet.service;


import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.monprojet.exception.AnalyseIADejaGenereeException;
import com.monprojet.entity.AnalyseIA;
import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.StatutPresence;
import com.monprojet.repository.AnalyseIARepository;
import com.monprojet.repository.PresenceRepository;
import com.monprojet.repository.UtilisateurRepository;

@Service
public class AnalyseIAService {

    private final AnalyseIARepository analyseIARepository;

    private final UtilisateurRepository utilisateurRepository;

    private final PresenceRepository presenceRepository;

    public AnalyseIAService(
            AnalyseIARepository analyseIARepository,
            UtilisateurRepository utilisateurRepository,
            PresenceRepository presenceRepository) {

        this.analyseIARepository =
                analyseIARepository;

        this.utilisateurRepository =
                utilisateurRepository;

        this.presenceRepository =
                presenceRepository;
    }

    /*
     * Générer analyse IA
     */
    public AnalyseIA genererAnalyse(
            Long utilisateurId) {

        Utilisateur utilisateur =
                utilisateurRepository
                        .findById(utilisateurId)
                        .orElseThrow();
        LocalDate aujourdHui =
                LocalDate.now();

        LocalDateTime debutJour =
                aujourdHui.atStartOfDay();

        LocalDateTime finJour =
                aujourdHui.atTime(23, 59, 59);

        boolean analyseExisteAujourdhui =
                analyseIARepository
                        .findFirstByUtilisateurIdAndDateAnalyseBetween(
                                utilisateurId,
                                debutJour,
                                finJour
                        )
                        .isPresent();

        if (analyseExisteAujourdhui) {

            throw new AnalyseIADejaGenereeException(
                    "Une analyse IA a déjà été générée aujourd'hui."
            );
        }

        long presences =
                presenceRepository
                        .countByUtilisateur(
                                utilisateur);

        long retards =
                presenceRepository
                        .countByUtilisateurAndStatutPresence(
                                utilisateur,
                                StatutPresence.RETARD);

        double scorePonctualite;

        if (presences == 0) {

            scorePonctualite = 0;

        } else {

            scorePonctualite =
                    ((double)
                            (presences - retards)
                            / presences)
                            * 100;    
        }
       

        /*
         * Estimation sur 30 jours ouvrables
         */
        double tauxPresence =
                (presences * 100.0) / 30.0;

        String regularite;

        if (scorePonctualite >= 90) {

            regularite = "EXCELLENTE";

        } else if (scorePonctualite >= 75) {

            regularite = "BONNE";

        } else if (scorePonctualite >= 50) {

            regularite = "MOYENNE";

        } else {

            regularite = "FAIBLE";
        }

        String recommandation;

        if (scorePonctualite >= 90) {

            recommandation =
                    "Très bon comportement. Continuer ainsi.";

        } else if (scorePonctualite >= 75) {

            recommandation =
                    "Quelques retards observés. Amélioration recommandée.";

        } else {

            recommandation =
                    "Présence irrégulière. Un suivi est conseillé.";
        }

        AnalyseIA analyse =
                new AnalyseIA();

        analyse.setUtilisateur(
                utilisateur);

        analyse.setDateAnalyse(
                java.time.LocalDateTime.now());

        analyse.setScorePonctualite(
                scorePonctualite);

        analyse.setTauxPresence(
                tauxPresence);

        analyse.setNiveauRegularite(
                regularite);

        analyse.setRecommandation(
                recommandation);

        return analyseIARepository
                .save(analyse);
    }

    /*
     * Historique analyses
     */
    public List<AnalyseIA>
    getAnalysesUtilisateur(
            Long utilisateurId) {

        return analyseIARepository
                .findByUtilisateurIdOrderByDateAnalyseDesc(
                        utilisateurId);
    }

    public List<AnalyseIA>
    getToutesLesAnalyses() {

        return analyseIARepository.findAll();
    }
}