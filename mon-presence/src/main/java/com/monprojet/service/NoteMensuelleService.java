package com.monprojet.service;

import com.monprojet.entity.NoteMensuelle;
import com.monprojet.entity.Presence;
import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.StatutJustificatif;
import com.monprojet.enums.StatutPresence;
import com.monprojet.repository.JustificatifRepository;
import com.monprojet.repository.NoteMensuelleRepository;
import com.monprojet.repository.PresenceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class NoteMensuelleService {

    private final NoteMensuelleRepository noteRepo;
    private final PresenceRepository presenceRepo;
    private final JustificatifRepository justificatifRepo;
    private final NotificationService notificationService;

    public NoteMensuelleService(
            NoteMensuelleRepository noteRepo,
            PresenceRepository presenceRepo,
            JustificatifRepository justificatifRepo,
            NotificationService notificationService) {
        this.noteRepo = noteRepo;
        this.presenceRepo = presenceRepo;
        this.justificatifRepo = justificatifRepo;
        this.notificationService = notificationService;
    }

    // -------------------------------------------------------
    // Calcul note automatique /20
    // Règles :
    //   PRESENT      = 20 pts
    //   RETARD       = 14 pts
    //   ABSENT + justificatif ACCEPTE = 16 pts
    //   ABSENT sans justificatif      =  0 pts
    // Score = moyenne sur les jours Lun-Ven du mois
    // -------------------------------------------------------
    public NoteMensuelle calculerNoteAuto(
            Utilisateur utilisateur, int mois, int annee) {

        List<Presence> presences = presenceRepo
                .findByUtilisateurAndMoisAndAnnee(utilisateur, mois, annee);

        // Compter les jours ouvrables du mois
        int joursOuvrables = compterJoursOuvrables(mois, annee);
        if (joursOuvrables == 0) joursOuvrables = 1;

        double totalPoints = 0;

        for (Presence p : presences) {
            // Ignorer week-ends
            java.time.DayOfWeek jour = p.getDatePresence().getDayOfWeek();
            if (jour == java.time.DayOfWeek.SATURDAY
                    || jour == java.time.DayOfWeek.SUNDAY) continue;

            if (p.getStatutPresence() == StatutPresence.PRESENT) {
                totalPoints += 20;
            } else if (p.getStatutPresence() == StatutPresence.RETARD) {
                totalPoints += 14;
            } else if (p.getStatutPresence() == StatutPresence.ABSENT) {
                // Cherche justificatif accepté pour cet agent
                boolean justifie = justificatifRepo
                        .findByUtilisateurOrderByDateCreationDesc(utilisateur)
                        .stream()
                        .anyMatch(j ->
                                j.getStatut() == StatutJustificatif.ACCEPTE
                                && j.getDateCreation() != null
                                && j.getDateCreation().toLocalDate()
                                        .equals(p.getDatePresence())
                        );
                totalPoints += justifie ? 16 : 0;
            }
        }

        double noteAuto = Math.min(20.0,
                (totalPoints / (joursOuvrables * 20.0)) * 20.0);
        noteAuto = Math.round(noteAuto * 100.0) / 100.0;

        // Créer ou mettre à jour la note
        Optional<NoteMensuelle> existante = noteRepo
                .findByUtilisateurAndMoisAndAnnee(utilisateur, mois, annee);

        NoteMensuelle note = existante.orElse(new NoteMensuelle());
        note.setUtilisateur(utilisateur);
        note.setMois(mois);
        note.setAnnee(annee);
        note.setNoteAutomatique(noteAuto);
        note.setDateMiseAJour(LocalDate.now());

        // Recalcul score final si note manuelle déjà présente
        if (note.isNoteManuelleDefinie() && note.getNoteManuelle() != null) {
            double scoreFinal = (noteAuto + note.getNoteManuelle()) / 2.0;
            scoreFinal = Math.round(scoreFinal * 100.0) / 100.0;
            note.setScoreFinal(scoreFinal);
        }

        return noteRepo.save(note);
    }

    // -------------------------------------------------------
    // Saisie note manuelle (chef pour agent, admin pour chef)
    // -------------------------------------------------------
    public NoteMensuelle saisirNoteManuelle(
            Utilisateur utilisateur,
            int mois, int annee,
            double noteManuelle,
            Utilisateur evaluateur) {

        if (noteManuelle < 0 || noteManuelle > 20) {
            throw new RuntimeException("La note doit être entre 0 et 20.");
        }

        Optional<NoteMensuelle> existante = noteRepo
                .findByUtilisateurAndMoisAndAnnee(utilisateur, mois, annee);

        NoteMensuelle note = existante.orElse(new NoteMensuelle());
        note.setUtilisateur(utilisateur);
        note.setMois(mois);
        note.setAnnee(annee);
        note.setNoteManuelle(noteManuelle);
        note.setNoteManuelleDefinie(true);
        note.setDateMiseAJour(LocalDate.now());

        // Calcul score final si note auto aussi présente
        if (note.getNoteAutomatique() != null) {
            double scoreFinal = (note.getNoteAutomatique() + noteManuelle) / 2.0;
            scoreFinal = Math.round(scoreFinal * 100.0) / 100.0;
            note.setScoreFinal(scoreFinal);
        }

        NoteMensuelle sauvegardee = noteRepo.save(note);

        // Notification à l'utilisateur évalué
        String nomEvaluateur = evaluateur.getPrenom()
                + " " + evaluateur.getNom();
        String moisStr = obtenirNomMois(mois) + " " + annee;
        notificationService.creerNotification(
                utilisateur,
                "Note mensuelle",
                nomEvaluateur + " vous a attribué une note de "
                        + noteManuelle + "/20 pour " + moisStr + "."
        );

        return sauvegardee;
    }

    // -------------------------------------------------------
    // Classement agents d'un service
    // -------------------------------------------------------
    public List<NoteMensuelle> getClassementAgentsService(
            Long serviceId, int mois, int annee) {
        return noteRepo.findClassementParService(serviceId, mois, annee);
    }

    // -------------------------------------------------------
    // Classement global chefs (pour admin)
    // -------------------------------------------------------
    public List<NoteMensuelle> getClassementChefs(int mois, int annee) {
        return noteRepo.findClassementChefs(mois, annee);
    }

    // -------------------------------------------------------
    // Classement global agents (pour admin)
    // -------------------------------------------------------
    public List<NoteMensuelle> getClassementAgents(int mois, int annee) {
        return noteRepo.findClassementAgents(mois, annee);
    }

    // -------------------------------------------------------
    // Notes d'un utilisateur (son historique)
    // -------------------------------------------------------
    public List<NoteMensuelle> getHistoriqueUtilisateur(
            Utilisateur utilisateur) {
        return noteRepo.findByUtilisateurOrderByAnneeDescMoisDesc(utilisateur);
    }

    // -------------------------------------------------------
    // Utilitaires
    // -------------------------------------------------------
    private int compterJoursOuvrables(int mois, int annee) {
        LocalDate debut = LocalDate.of(annee, mois, 1);
        LocalDate fin = debut.withDayOfMonth(debut.lengthOfMonth());
        int count = 0;
        LocalDate current = debut;
        while (!current.isAfter(fin)) {
            java.time.DayOfWeek dow = current.getDayOfWeek();
            if (dow != java.time.DayOfWeek.SATURDAY
                    && dow != java.time.DayOfWeek.SUNDAY) {
                count++;
            }
            current = current.plusDays(1);
        }
        return count;
    }

    private String obtenirNomMois(int mois) {
        String[] noms = {"", "janvier", "février", "mars", "avril",
                "mai", "juin", "juillet", "août",
                "septembre", "octobre", "novembre", "décembre"};
        return (mois >= 1 && mois <= 12) ? noms[mois] : String.valueOf(mois);
    }
}