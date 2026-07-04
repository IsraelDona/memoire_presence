package com.monprojet.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;

import com.monprojet.entity.AnalyseIA;
import com.monprojet.entity.Presence;
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

        this.analyseIARepository = analyseIARepository;
        this.utilisateurRepository = utilisateurRepository;
        this.presenceRepository = presenceRepository;
    }

    /*
     * Génère (ou régénère) l'analyse du jour pour un utilisateur.
     * Appelée automatiquement après chaque pointage,
     * et par la tâche planifiée quotidienne.
     * Remplace l'analyse du jour si elle existe déjà,
     * au lieu de bloquer.
     */
    public AnalyseIA genererAnalyse(Long utilisateurId) {

        Utilisateur utilisateur =
                utilisateurRepository
                        .findById(utilisateurId)
                        .orElseThrow();

        LocalDate aujourdHui = LocalDate.now();
        LocalDateTime debutJour = aujourdHui.atStartOfDay();
        LocalDateTime finJour = aujourdHui.atTime(23, 59, 59);

        AnalyseIA analyse =
                analyseIARepository
                        .findFirstByUtilisateurIdAndDateAnalyseBetween(
                                utilisateurId, debutJour, finJour)
                        .orElseGet(AnalyseIA::new);

        long presences =
                presenceRepository.countByUtilisateur(utilisateur);

        long retards =
                presenceRepository.countByUtilisateurAndStatutPresence(
                        utilisateur, StatutPresence.RETARD);

        double scorePonctualite;

        if (presences == 0) {
            scorePonctualite = 0;
        } else {
            scorePonctualite =
                    ((double) (presences - retards) / presences) * 100;
        }

        double tauxPresence = (presences * 100.0) / 30.0;

        List<Presence> historique =
                presenceRepository
                        .findByUtilisateurOrderByDatePresenceDesc(utilisateur);

        int serieJours = calculerSerieJours(historique);
        Double tendance = calculerTendance(utilisateurId, scorePonctualite);

        String regularite = determinerRegularite(scorePonctualite);
        String badge = determinerBadge(scorePonctualite, serieJours);
        String recommandation =
                construireRecommandation(utilisateur, scorePonctualite, tendance);
        String conseil =
                construireConseil(scorePonctualite, tendance, retards, serieJours);

        analyse.setUtilisateur(utilisateur);
        analyse.setDateAnalyse(LocalDateTime.now());
        analyse.setScorePonctualite(scorePonctualite);
        analyse.setTauxPresence(tauxPresence);
        analyse.setNiveauRegularite(regularite);
        analyse.setRecommandation(recommandation);
        analyse.setConseil(conseil);
        analyse.setBadge(badge);
        analyse.setSerieJours(serieJours);

        return analyseIARepository.save(analyse);
    }

    /*
     * Compte les jours consécutifs (depuis le plus récent)
     * où le statut n'est pas ABSENT.
     */
    private int calculerSerieJours(List<Presence> historiqueDesc) {
        int serie = 0;
        LocalDate jourAttendu = null;

        for (Presence presence : historiqueDesc) {
            if (presence.getStatutPresence() == StatutPresence.ABSENT) {
                break;
            }

            LocalDate datePresence = presence.getDatePresence();

            if (jourAttendu == null) {
                jourAttendu = datePresence;
                serie = 1;
                continue;
            }

            long ecart = ChronoUnit.DAYS.between(datePresence, jourAttendu);

            if (ecart == 1) {
                serie++;
                jourAttendu = datePresence;
            } else if (ecart == 0) {
                // même jour, plusieurs pointages : on ignore le doublon
                continue;
            } else {
                break;
            }
        }

        return serie;
    }

    /*
     * Compare le score actuel à la dernière analyse enregistrée
     * pour déterminer si l'agent progresse ou régresse.
     * Retourne null si aucune analyse précédente n'existe.
     */
    private Double calculerTendance(Long utilisateurId, double scoreActuel) {
        List<AnalyseIA> historiqueAnalyses =
                analyseIARepository
                        .findByUtilisateurIdOrderByDateAnalyseDesc(utilisateurId);

        if (historiqueAnalyses.isEmpty()) {
            return null;
        }

        double dernierScore = historiqueAnalyses.get(0).getScorePonctualite();
        return scoreActuel - dernierScore;
    }

    private String determinerRegularite(double score) {
        if (score >= 90) {
            return "EXCELLENTE";
        }
        if (score >= 75) {
            return "BONNE";
        }
        if (score >= 50) {
            return "MOYENNE";
        }
        return "FAIBLE";
    }

    private String determinerBadge(double score, int serieJours) {
        if (score >= 95 && serieJours >= 10) {
            return "EXEMPLAIRE";
        }
        if (score >= 90) {
            return "TRES_BON";
        }
        if (score >= 75) {
            return "MOYEN";
        }
        return "A_AMELIORER";
    }

    private String construireRecommandation(
            Utilisateur utilisateur, double score, Double tendance) {

        String prenom = utilisateur.getPrenom();
        String nom = utilisateur.getNom();
        String nomComplet =
                (prenom != null ? prenom : "") + " " + (nom != null ? nom : "");
        nomComplet = nomComplet.trim();

        if (score >= 90) {
            return "Félicitations" + (nomComplet.isEmpty() ? "" : " " + nomComplet)
                    + " ! Votre assiduité est remarquable avec un taux de ponctualité de "
                    + String.format("%.0f", score)
                    + "%. Continuez sur cette lancée, votre régularité constitue "
                    + "un exemple positif pour l'équipe.";
        }

        if (score >= 75) {
            String tendanceTxt = (tendance != null && tendance < 0)
                    ? " Quelques retards ont été enregistrés récemment."
                    : "";
            return "Votre assiduité est globalement satisfaisante." + tendanceTxt
                    + " Une meilleure régularité pourrait encore améliorer vos performances. "
                    + "Continuez vos efforts.";
        }

        return "Attention : plusieurs absences ou retards ont été observés récemment. "
                + "Il est conseillé de revoir l'organisation de votre temps afin "
                + "d'améliorer votre régularité. Une amélioration progressive est toujours possible.";
    }

    private String construireConseil(
            double score, Double tendance, long retards, int serieJours) {

        if (score >= 95 && serieJours >= 10) {
            return "Vous maintenez une excellente régularité depuis " + serieJours
                    + " jours. Cette constance est un atout fort pour votre évaluation "
                    + "de performance auprès de votre chef de service. Continuez ainsi.";
        }

        if (tendance != null && tendance < -5) {
            return "Votre score a baissé récemment. Pointez à l'heure durant les prochains "
                    + "jours pour repasser au-dessus de 90% avant la prochaine évaluation.";
        }

        if (tendance != null && tendance > 5) {
            return "Bonne progression ! Maintenez ce rythme quelques jours de plus "
                    + "pour atteindre le niveau Exemplaire.";
        }

        if (score < 75) {
            return "Essayez de pointer avant l'heure d'ouverture les prochains jours : "
                    + "cela peut faire remonter rapidement votre score de ponctualité.";
        }

        return "Continuez à pointer régulièrement et à l'heure : votre score de ponctualité "
                + "influence directement l'appréciation de votre chef de service.";
    }

    /*
     * Historique analyses
     */
    public List<AnalyseIA> getAnalysesUtilisateur(Long utilisateurId) {
        return analyseIARepository
                .findByUtilisateurIdOrderByDateAnalyseDesc(utilisateurId);
    }

    public List<AnalyseIA> getToutesLesAnalyses() {
        return analyseIARepository.findAll();
    }
}