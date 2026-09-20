package com.monprojet.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.monprojet.entity.AnalyseIA;
import com.monprojet.entity.Justificatif;
import com.monprojet.entity.Presence;
import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.StatutJustificatif;
import com.monprojet.enums.StatutPresence;
import com.monprojet.repository.AnalyseIARepository;
import com.monprojet.repository.JustificatifRepository;
import com.monprojet.repository.PresenceRepository;
import com.monprojet.repository.UtilisateurRepository;

@Service
public class AnalyseIAService {

    /*
     * Heure à partir de laquelle la journée est close : un agent qui
     * n'a toujours pas pointé est alors compté absent.
     */
    private static final java.time.LocalTime HEURE_LIMITE_ABSENCE =
            java.time.LocalTime.of(21, 0);

    /*
     * Poids d'un jour pointé en retard dans le score.
     *
     * Une journée à l'heure vaut 1, une absence 0. Un retard vaut
     * une fraction : l'agent est venu travailler, ce n'est pas
     * équivalent à ne pas être venu du tout. Avec 0.5, quelqu'un
     * systématiquement en retard obtient 50 % et non 0 %.
     *
     * C'est le seul réglage à modifier pour durcir ou assouplir la
     * sanction du retard.
     */
    public static final double POIDS_RETARD = 0.5;

    private final AnalyseIARepository analyseIARepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PresenceRepository presenceRepository;
    private final JustificatifRepository justificatifRepository;
    private final JoursFeriesService joursFeriesService;

    public AnalyseIAService(
            AnalyseIARepository analyseIARepository,
            UtilisateurRepository utilisateurRepository,
            PresenceRepository presenceRepository,
            JustificatifRepository justificatifRepository,
            JoursFeriesService joursFeriesService) {

        this.analyseIARepository = analyseIARepository;
        this.utilisateurRepository = utilisateurRepository;
        this.presenceRepository = presenceRepository;
        this.justificatifRepository = justificatifRepository;
        this.joursFeriesService = joursFeriesService;
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

        /*
         * Initialise le cycle si l'utilisateur n'en a jamais eu un
         */
        if (utilisateur.getDateDebutCycleAnalyse() == null) {
            utilisateur.setDateDebutCycleAnalyse(aujourdHui);
            utilisateurRepository.save(utilisateur);
        }

        LocalDate debutCycle = utilisateur.getDateDebutCycleAnalyse();

        List<Presence> presencesCycle =
                presenceRepository.findByUtilisateurAndPeriode(
                        utilisateur, debutCycle, aujourdHui.plusDays(1));

        List<Justificatif> justificatifsCycle =
                justificatifRepository
                        .findByUtilisateurAndStatutAndDateFinGreaterThanEqual(
                                utilisateur, StatutJustificatif.ACCEPTE, debutCycle);

        /*
         * Analyse jour ouvré par jour ouvré, du début du cycle
         * jusqu'à aujourd'hui : chaque jour ouvré passé est soit
         * pointé (présent/retard), soit couvert par un justificatif
         * accepté (neutre), soit absent (pénalisant). Le jour en
         * cours n'est compté que s'il a déjà été pointé : la
         * journée n'étant pas terminée, on ne peut pas encore la
         * classer comme une absence.
         */
        long joursCollectes = 0;
        long presences = 0;
        long retards = 0;
        long joursJustifies = 0;
        long absences = 0;

        /*
         * Au-delà de cette heure, un agent qui n'a pas pointé
         * aujourd'hui est considéré comme absent.
         */
        boolean journeeTerminee =
                java.time.LocalTime.now().isAfter(HEURE_LIMITE_ABSENCE);

        /*
         * Chargés en une fois : un appel par jour du cycle
         * multiplierait les requêtes inutilement.
         */
        java.util.Set<LocalDate> joursFeries =
                joursFeriesService.joursFeriesEntre(debutCycle, aujourdHui);

        LocalDate jour = debutCycle;

        while (!jour.isAfter(aujourdHui)) {

            /*
             * Un jour férié chômé n'est pas travaillé : il ne compte
             * ni comme présence attendue, ni comme absence.
             */
            boolean estJourOuvre =
                    jour.getDayOfWeek() != java.time.DayOfWeek.SATURDAY
                    && jour.getDayOfWeek() != java.time.DayOfWeek.SUNDAY
                    && !joursFeries.contains(jour);

            if (estJourOuvre) {

                Presence presenceDuJour = trouverPresence(presencesCycle, jour);

                if (presenceDuJour != null) {
                    joursCollectes++;
                    presences++;

                    if (presenceDuJour.getStatutPresence() == StatutPresence.RETARD) {
                        retards++;
                    }

                } else if (estJourJustifie(justificatifsCycle, jour)) {
                    joursCollectes++;
                    joursJustifies++;

                } else if (jour.isBefore(aujourdHui) || journeeTerminee) {
                    /*
                     * Jour ouvré sans pointage ni justificatif :
                     * absence. Pour aujourd'hui, on attend l'heure
                     * limite (21h) avant de conclure à une absence,
                     * afin de laisser à l'agent le temps de pointer.
                     */
                    joursCollectes++;
                    absences++;
                }
            }

            jour = jour.plusDays(1);
        }

        boolean cycleComplet = joursCollectes >= 14;

        long joursEvaluables = presences + absences;

        /*
         * Une journée à l'heure vaut 1 point, un retard une fraction,
         * une absence 0.
         */
        double pointsAcquis =
                (presences - retards) + (retards * POIDS_RETARD);

        double scorePonctualite = joursEvaluables == 0
                ? 0
                : (pointsAcquis / joursEvaluables) * 100;

        double tauxPresence = joursCollectes == 0
                ? 0
                : (presences * 100.0) / (double) joursCollectes;

        int serieJours = calculerSerieJours(
                debutCycle, aujourdHui, presencesCycle, justificatifsCycle, joursFeries);
        Double tendance = calculerTendance(utilisateurId, scorePonctualite);

        String regularite = determinerRegularite(scorePonctualite);
        String badge = determinerBadge(scorePonctualite, serieJours);
        String recommandation =
                construireRecommandation(
                        utilisateur, scorePonctualite, tendance, joursJustifies, absences, retards);
        String conseil =
                construireConseil(scorePonctualite, tendance, retards, serieJours, joursJustifies, absences);

        analyse.setUtilisateur(utilisateur);
        analyse.setDateAnalyse(LocalDateTime.now());
        analyse.setScorePonctualite(scorePonctualite);
        analyse.setTauxPresence(tauxPresence);
        analyse.setNiveauRegularite(regularite);
        analyse.setRecommandation(recommandation);
        analyse.setConseil(conseil);
        analyse.setBadge(badge);
        analyse.setSerieJours(serieJours);
        analyse.setJoursCollectes((int) joursCollectes);
        analyse.setNombrePresences((int) presences);
        analyse.setNombreRetards((int) retards);
        analyse.setNombreAbsences((int) absences);
        analyse.setNombreJoursJustifies((int) joursJustifies);
        analyse.setAnalyseComplete(cycleComplet);

        AnalyseIA analyseSauvegardee = analyseIARepository.save(analyse);

        /*
         * Cycle terminé : on relance un nouveau cycle de 14 jours
         */
        /*
         * Le nouveau cycle démarre le lendemain : le faire partir
         * aujourd'hui compterait deux fois la journée qui vient de
         * clôturer le cycle précédent.
         */
        if (cycleComplet) {
            utilisateur.setDateDebutCycleAnalyse(aujourdHui.plusDays(1));
            utilisateurRepository.save(utilisateur);
        }

        return analyseSauvegardee;
    }

    /*
     * Retrouve la présence enregistrée à une date précise,
     * s'il y en a une, dans une liste déjà chargée.
     */
    private Presence trouverPresence(List<Presence> presences, LocalDate jour) {
        for (Presence presence : presences) {
            if (presence.getDatePresence() != null
                    && presence.getDatePresence().isEqual(jour)) {
                return presence;
            }
        }
        return null;
    }

    /*
     * Vrai si une date précise est couverte par un des
     * justificatifs acceptés déjà chargés.
     */
    private boolean estJourJustifie(List<Justificatif> justificatifs, LocalDate jour) {
        for (Justificatif justificatif : justificatifs) {
            if (justificatif.getDateDebut() != null
                    && justificatif.getDateFin() != null
                    && !jour.isBefore(justificatif.getDateDebut())
                    && !jour.isAfter(justificatif.getDateFin())) {
                return true;
            }
        }
        return false;
    }

    /*
     * Série de jours ouvrés consécutifs sans absence non
     * justifiée, en partant du jour le plus récent du cycle
     * et en remontant dans le temps. Un jour justifié ne casse
     * pas la série (neutre), le jour en cours non encore
     * pointé non plus.
     */
    private int calculerSerieJours(
            LocalDate debutCycle,
            LocalDate aujourdHui,
            List<Presence> presencesCycle,
            List<Justificatif> justificatifsCycle,
            java.util.Set<LocalDate> joursFeries) {

        int serie = 0;
        LocalDate jour = aujourdHui;

        while (!jour.isBefore(debutCycle)) {

            boolean estJourOuvre =
                    jour.getDayOfWeek() != java.time.DayOfWeek.SATURDAY
                    && jour.getDayOfWeek() != java.time.DayOfWeek.SUNDAY
                    && !joursFeries.contains(jour);

            if (estJourOuvre) {

                Presence presenceDuJour = trouverPresence(presencesCycle, jour);

                if (presenceDuJour != null) {
                    serie++;
                } else if (estJourJustifie(justificatifsCycle, jour)) {
                    // neutre : ne casse pas la série
                } else if (jour.isEqual(aujourdHui)) {
                    // journée en cours, pas encore pointée : neutre
                } else {
                    break;
                }
            }

            jour = jour.minusDays(1);
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

    /*
     * Nomme précisément ce qui pèse sur le score, plutôt que
     * d'annoncer « des absences ou des retards » sans distinguer.
     */
    private String decrireEcarts(long absences, long retards) {

        if (absences > 0 && retards > 0) {
            return absences + " absence(s) non justifiée(s) et "
                    + retards + " retard(s) ont été relevés";
        }

        if (absences > 0) {
            return absences + " absence(s) non justifiée(s) ont été relevées";
        }

        if (retards > 0) {
            return retards + " retard(s) ont été relevés";
        }

        return "aucune absence ni retard n'a été relevé";
    }

    private String construireRecommandation(
            Utilisateur utilisateur, double score, Double tendance,
            long joursJustifies, long absences, long retards) {

        String prenom = utilisateur.getPrenom();
        String nom = utilisateur.getNom();
        String nomComplet =
                (prenom != null ? prenom : "") + " " + (nom != null ? nom : "");
        nomComplet = nomComplet.trim();

        String justificatifTxt = joursJustifies > 0
                ? " " + joursJustifies + " jour(s) d'absence justifiée n'ont pas été comptés"
                        + " contre vous sur cette période."
                : "";

        String absenceTxt = absences > 0
                ? " " + absences + " jour(s) d'absence non justifiée : pense à "
                        + "soumettre un justificatif si tu en as un."
                : "";

        if (score >= 90) {
            return "Félicitations" + (nomComplet.isEmpty() ? "" : " " + nomComplet)
                    + " ! Votre assiduité est remarquable avec un taux de ponctualité de "
                    + String.format("%.0f", score)
                    + "%. Continuez sur cette lancée, votre régularité constitue "
                    + "un exemple positif pour l'équipe." + justificatifTxt;
        }

        if (score >= 75) {
            String tendanceTxt = (tendance != null && tendance < 0)
                    ? " Quelques retards ont été enregistrés récemment."
                    : "";
            return "Votre assiduité est globalement satisfaisante." + tendanceTxt
                    + " Une meilleure régularité pourrait encore améliorer vos performances. "
                    + "Continuez vos efforts." + justificatifTxt + absenceTxt;
        }

        return "Attention : sur cette période, " + decrireEcarts(absences, retards) + "."
                + " Il est conseillé de revoir l'organisation de votre temps afin "
                + "d'améliorer votre régularité. Une amélioration progressive est toujours possible."
                + justificatifTxt;
    }

    private String construireConseil(
            double score, Double tendance, long retards, int serieJours,
            long joursJustifies, long absences) {

        if (score >= 95 && serieJours >= 10) {
            return "Vous maintenez une excellente régularité depuis " + serieJours
                    + " jours. Cette constance est un atout fort pour votre évaluation "
                    + "de performance auprès de votre chef de service. Continuez ainsi.";
        }

        if (absences > 0) {
            return "Vous comptez " + absences + " jour(s) d'absence non justifiée sur cette "
                    + "période, ce qui pèse directement sur votre score. Si l'une de ces "
                    + "absences était justifiée, dépose un justificatif pour la faire retirer "
                    + "du calcul.";
        }

        if (tendance != null && tendance < -5) {
            return "Votre score a baissé récemment. Pointez à l'heure durant les prochains "
                    + "jours pour repasser au-dessus de 90% avant la prochaine évaluation.";
        }

        if (tendance != null && tendance > 5) {
            return "Bonne progression ! Maintenez ce rythme quelques jours de plus "
                    + "pour atteindre le niveau Exemplaire.";
        }

        if (retards > 0 && joursJustifies > 0) {
            return "Sur cette période, " + retards + " retard(s) ont été enregistrés, mais "
                    + joursJustifies + " jour(s) d'absence justifiée n'ont pas impacté votre "
                    + "score. Concentrez-vous sur la ponctualité de vos prochains pointages.";
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