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

        /*
         * Tous les agents, actifs comme inactifs : c'est une
         * statistique d'effectif, un compte désactivé reste un agent
         * de la direction. En revanche on ne compte que le rôle
         * AGENT : l'ancien calcul utilisait count() et incluait donc
         * aussi l'administrateur, le directeur et les chefs.
         */
        long nombreAgents = compterParRole(com.monprojet.enums.RoleName.AGENT);

        long nombreChefsService =
                compterParRole(com.monprojet.enums.RoleName.CHEF_SERVICE);

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

        /*
         * Même formule que le score individuel de l'Analyse IA, pour
         * que les deux chiffres racontent la même histoire : une
         * journée à l'heure vaut 1, un retard une fraction, une
         * absence 0. L'ancien calcul rapportait les retards aux
         * seuls pointages et ignorait complètement les absences —
         * d'où un score flatteur alors que la majorité des journées
         * n'étaient pas travaillées.
         */
        long nombreAbsences = compterAbsences();

        long joursEvaluables = nombrePresences + nombreAbsences;

        double pointsAcquis =
                (nombrePresences - nombreRetards)
                + (nombreRetards * AnalyseIAService.POIDS_RETARD);

        double scoreGlobal = joursEvaluables == 0
                ? 0
                : (pointsAcquis / joursEvaluables) * 100;

        stats.setNombreAgents(
                nombreAgents);

        stats.setNombreChefsService(
                nombreChefsService);

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

        stats.setNombreAbsences(nombreAbsences);

        stats.setEvolutionMensuelle(
                calculerEvolutionMensuelle());

        return stats;
    }

    /*
     * Effectif d'un rôle, comptes actifs et désactivés confondus :
     * c'est une statistique d'effectif, un compte suspendu reste une
     * personne rattachée à la direction.
     */
    private long compterParRole(com.monprojet.enums.RoleName role) {

        return utilisateurRepository.findAll()
                .stream()
                .filter(utilisateur ->
                        utilisateur.getRole() != null
                        && utilisateur.getRole().getNomRole() == role)
                .count();
    }

    /*
     * Une absence ne laisse aucune ligne en base : elle se déduit
     * des jours ouvrés sans pointage ni justificatif. Ce calcul est
     * déjà fait par l'Analyse IA, on somme donc les compteurs de la
     * dernière analyse de chaque utilisateur actif plutôt que de le
     * refaire ici avec le risque d'aboutir à un chiffre différent.
     */
    private long compterAbsences() {

        return utilisateurRepository.findByActifTrue()
                .stream()
                .map(utilisateur ->
                        analyseIARepository
                                .findByUtilisateurIdOrderByDateAnalyseDesc(utilisateur.getId())
                                .stream()
                                .findFirst()
                                .map(com.monprojet.entity.AnalyseIA::getNombreAbsences)
                                .orElse(0))
                .mapToLong(Integer::longValue)
                .sum();
    }

    private java.util.List<com.monprojet.dto.EvolutionMensuelleDTO>
    calculerEvolutionMensuelle() {

        java.util.List<Object[]> resultats =
                presenceRepository.getStatistiquesParMois();

        java.util.List<com.monprojet.dto.EvolutionMensuelleDTO> evolution =
                new java.util.ArrayList<>();

        for (Object[] ligne : resultats) {
            String mois = (String) ligne[0];
            long total = ((Number) ligne[1]).longValue();
            long retards = ((Number) ligne[2]).longValue();

            double taux = total == 0
                    ? 0
                    : ((double) (total - retards) / total) * 100;

            evolution.add(
                    new com.monprojet.dto.EvolutionMensuelleDTO(
                            formaterMois(mois), taux));
        }

        return evolution;
    }

    /*
     * La requête trie sur "AAAA-MM" pour garder l'ordre
     * chronologique ; l'affichage, lui, place le mois avant
     * l'année ("05-2026").
     */
    private String formaterMois(String moisAnnee) {

        if (moisAnnee == null || !moisAnnee.contains("-")) {
            return moisAnnee;
        }

        String[] parties = moisAnnee.split("-");

        if (parties.length != 2) {
            return moisAnnee;
        }

        return parties[1] + "-" + parties[0];
    }
}