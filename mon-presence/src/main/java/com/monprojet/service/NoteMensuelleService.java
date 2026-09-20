package com.monprojet.service;

import com.monprojet.entity.AnalyseIA;
import com.monprojet.entity.NoteMensuelle;
import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.RoleName;
import com.monprojet.repository.NoteMensuelleRepository;
import com.monprojet.repository.UtilisateurRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class NoteMensuelleService {

    private final NoteMensuelleRepository noteRepo;
    private final NotificationService notificationService;
    private final UtilisateurRepository utilisateurRepo;
    private final AnalyseIAService analyseIAService;

    public NoteMensuelleService(
            NoteMensuelleRepository noteRepo,
            NotificationService notificationService,
            UtilisateurRepository utilisateurRepo,
            AnalyseIAService analyseIAService) {

        this.noteRepo = noteRepo;
        this.notificationService = notificationService;
        this.utilisateurRepo = utilisateurRepo;
        this.analyseIAService = analyseIAService;
    }

    // -------------------------------------------------------
    // Calcul note automatique /20
    //
    // La note n'est plus recalculee ici avec sa propre formule :
    // elle derive directement du score de ponctualite de
    // l'Analyse IA, ramene sur 20. Les deux systemes reposent
    // ainsi sur le meme calcul et ne peuvent plus diverger :
    // l'agent est classe sur le score exact qu'il voit dans son
    // analyse.
    // -------------------------------------------------------
    public NoteMensuelle calculerNoteAuto(
            Utilisateur utilisateur,
            int mois,
            int annee) {

        AnalyseIA analyse =
                analyseIAService.genererAnalyse(utilisateur.getId());

        /*
         * scorePonctualite est exprime en pourcentage (0 a 100),
         * la note attendue est sur 20.
         */
        double noteAuto = analyse.getScorePonctualite() / 5.0;

        noteAuto = Math.round(noteAuto * 100.0) / 100.0;

        Optional<NoteMensuelle> existante =
                noteRepo.findByUtilisateurAndMoisAndAnnee(
                        utilisateur,
                        mois,
                        annee
                );

        NoteMensuelle note =
                existante.orElse(new NoteMensuelle());

        note.setUtilisateur(utilisateur);
        note.setMois(mois);
        note.setAnnee(annee);
        note.setNoteAutomatique(noteAuto);
        note.setDateMiseAJour(LocalDate.now());

        // -------------------------------------------------------
        // Calcul du score final si une note manuelle existe
        // -------------------------------------------------------

        if (note.isNoteManuelleDefinie()
                && note.getNoteManuelle() != null) {

            double scoreFinal =
                    (noteAuto + note.getNoteManuelle()) / 2.0;

            scoreFinal =
                    Math.round(scoreFinal * 100.0) / 100.0;

            note.setScoreFinal(scoreFinal);
        }

        return noteRepo.save(note);
    }

    // -------------------------------------------------------
    // Saisie note manuelle
    // -------------------------------------------------------

    public NoteMensuelle saisirNoteManuelle(
            Utilisateur utilisateur,
            int mois,
            int annee,
            double noteManuelle,
            Utilisateur evaluateur) {

        if (noteManuelle < 0 || noteManuelle > 20) {
            throw new RuntimeException(
                    "La note doit être entre 0 et 20."
            );
        }

        /*
         * Seul un chef de service peut recevoir une note manuelle,
         * et elle est saisie par le Directeur. Les agents sont
         * classes uniquement sur leur note automatique : aucune
         * appreciation humaine n'entre dans leur evaluation.
         */
        if (utilisateur.getRole() == null
                || utilisateur.getRole().getNomRole()
                        != RoleName.CHEF_SERVICE) {

            throw new RuntimeException(
                    "Seul un chef de service peut recevoir une note manuelle."
            );
        }

        Optional<NoteMensuelle> existante =
                noteRepo.findByUtilisateurAndMoisAndAnnee(
                        utilisateur,
                        mois,
                        annee
                );

        NoteMensuelle note =
                existante.orElse(new NoteMensuelle());

        note.setUtilisateur(utilisateur);
        note.setMois(mois);
        note.setAnnee(annee);
        note.setNoteManuelle(noteManuelle);
        note.setNoteManuelleDefinie(true);
        note.setDateMiseAJour(LocalDate.now());

        // Calcul du score final si la note automatique existe
        if (note.getNoteAutomatique() != null) {

            double scoreFinal =
                    (note.getNoteAutomatique() + noteManuelle) / 2.0;

            scoreFinal =
                    Math.round(scoreFinal * 100.0) / 100.0;

            note.setScoreFinal(scoreFinal);
        }

        NoteMensuelle sauvegardee =
                noteRepo.save(note);

        // -------------------------------------------------------
        // Notification à l'utilisateur évalué
        // -------------------------------------------------------

        String nomEvaluateur =
                evaluateur.getPrenom()
                        + " "
                        + evaluateur.getNom();

        String moisStr =
                obtenirNomMois(mois)
                        + " "
                        + annee;

        notificationService.creerNotification(
                utilisateur,
                "Note mensuelle",
                nomEvaluateur
                        + " vous a attribué une note de "
                        + noteManuelle
                        + "/20 pour "
                        + moisStr
                        + "."
        );

        return sauvegardee;
    }

    // -------------------------------------------------------
    // Classement agents d'un service
    // -------------------------------------------------------

    public List<NoteMensuelle> getClassementAgentsService(
            Long serviceId,
            int mois,
            int annee) {

        utilisateurRepo.findByServiceId(serviceId)
                .stream()
                .filter(this::estAgentActif)
                .forEach(agent -> calculerNoteAuto(agent, mois, annee));

        return noteRepo.findClassementParService(
                serviceId,
                mois,
                annee
        );
    }

    // -------------------------------------------------------
    // Classement global chefs
    // -------------------------------------------------------

    public List<NoteMensuelle> getClassementChefs(
            int mois,
            int annee) {

        utilisateurRepo.findByActifTrue()
                .stream()
                .filter(this::estChefActif)
                .forEach(chef -> calculerNoteAuto(chef, mois, annee));

        return noteRepo.findClassementChefs(
                mois,
                annee
        );
    }

    // -------------------------------------------------------
    // Classement global agents
    // -------------------------------------------------------

    public List<NoteMensuelle> getClassementAgents(
            int mois,
            int annee) {

        utilisateurRepo.findByActifTrue()
                .stream()
                .filter(this::estAgentActif)
                .forEach(agent -> calculerNoteAuto(agent, mois, annee));

        return noteRepo.findClassementAgents(
                mois,
                annee
        );
    }

    private boolean estAgentActif(Utilisateur utilisateur) {
        return utilisateur.isActif()
                && utilisateur.getRole() != null
                && utilisateur.getRole().getNomRole() == RoleName.AGENT;
    }

    private boolean estChefActif(Utilisateur utilisateur) {
        return utilisateur.isActif()
                && utilisateur.getRole() != null
                && utilisateur.getRole().getNomRole() == RoleName.CHEF_SERVICE;
    }

    // -------------------------------------------------------
    // Notes d'un utilisateur
    // -------------------------------------------------------

    public List<NoteMensuelle> getHistoriqueUtilisateur(
            Utilisateur utilisateur) {

        return noteRepo.findByUtilisateurOrderByAnneeDescMoisDesc(
                utilisateur
        );
    }

    // -------------------------------------------------------
    // Nom du mois
    // -------------------------------------------------------

    private String obtenirNomMois(int mois) {

        String[] noms = {
                "",
                "janvier",
                "février",
                "mars",
                "avril",
                "mai",
                "juin",
                "juillet",
                "août",
                "septembre",
                "octobre",
                "novembre",
                "décembre"
        };

        return (mois >= 1 && mois <= 12)
                ? noms[mois]
                : String.valueOf(mois);
    }
    
}