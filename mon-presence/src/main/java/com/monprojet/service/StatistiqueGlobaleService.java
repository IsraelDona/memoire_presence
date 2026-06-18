package com.monprojet.service;

import org.springframework.stereotype.Service;

import com.monprojet.dto.StatistiqueGlobaleResponse;
import com.monprojet.enums.StatutPresence;
import com.monprojet.repository.AnalyseIARepository;
import com.monprojet.repository.JustificatifRepository;
import com.monprojet.repository.MissionRepository;
import com.monprojet.repository.PresenceRepository;
import com.monprojet.repository.ReunionRepository;
import com.monprojet.repository.UtilisateurRepository;

@Service
public class StatistiqueGlobaleService {

    private final UtilisateurRepository utilisateurRepository;

    private final PresenceRepository presenceRepository;

    private final AnalyseIARepository analyseIARepository;

    private final JustificatifRepository justificatifRepository;

    private final MissionRepository missionRepository;

    private final ReunionRepository reunionRepository;

    public StatistiqueGlobaleService(
            UtilisateurRepository utilisateurRepository,
            PresenceRepository presenceRepository,
            AnalyseIARepository analyseIARepository,
            JustificatifRepository justificatifRepository,
            MissionRepository missionRepository,
            ReunionRepository reunionRepository) {

        this.utilisateurRepository =
                utilisateurRepository;

        this.presenceRepository =
                presenceRepository;

        this.analyseIARepository =
                analyseIARepository;

        this.justificatifRepository =
                justificatifRepository;

        this.missionRepository =
                missionRepository;

        this.reunionRepository =
                reunionRepository;
    }

    public StatistiqueGlobaleResponse
    getStatistiquesGlobales() {

        StatistiqueGlobaleResponse stats =
                new StatistiqueGlobaleResponse();

        long nombreAgents =
                utilisateurRepository.count();

        long nombrePresences =
                presenceRepository.count();

        long nombreRetards =
                presenceRepository.countByStatutPresence(
                        StatutPresence.RETARD
                );

        long nombreAnalyses =
                analyseIARepository.count();

        long nombreJustificatifs =
                justificatifRepository.count();

        long nombreMissions =
                missionRepository.count();

        long nombreReunions =
                reunionRepository.count();

        double scoreGlobal;

        if (nombrePresences == 0) {

            scoreGlobal = 0;

        } else {

            scoreGlobal =
                    ((double)
                            (nombrePresences
                                    - nombreRetards)
                            / nombrePresences)
                            * 100;
        }

        stats.setNombreAgents(
                nombreAgents);

        stats.setNombrePresences(
                nombrePresences);

        stats.setNombreRetards(
                nombreRetards);

        stats.setNombreAnalysesIA(
                nombreAnalyses);

        stats.setNombreJustificatifs(
                nombreJustificatifs);

        stats.setNombreMissions(
                nombreMissions);

        stats.setNombreReunions(
                nombreReunions);

        stats.setScoreGlobalPonctualite(
                scoreGlobal);

        return stats;
    }
}