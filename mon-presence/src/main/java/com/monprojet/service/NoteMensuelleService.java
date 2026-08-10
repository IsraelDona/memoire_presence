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
import java.util.List;
import java.util.Optional;
import java.time.DayOfWeek;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NoteMensuelleService {

	private final NoteMensuelleRepository noteRepo;
	private final PresenceRepository presenceRepo;
	private final JustificatifRepository justificatifRepo;
	private final NotificationService notificationService;

	public NoteMensuelleService(NoteMensuelleRepository noteRepo, PresenceRepository presenceRepo,
			JustificatifRepository justificatifRepo, NotificationService notificationService) {
		this.noteRepo = noteRepo;
		this.presenceRepo = presenceRepo;
		this.justificatifRepo = justificatifRepo;
		this.notificationService = notificationService;
	}

	private static final double POINT_PRESENT = 20.0;
	private static final double POINT_RETARD = 14.0;
	private static final double POINT_ABSENCE_JUSTIFIEE = 16.0;
	private static final double POINT_ABSENCE_INJUSTIFIEE = 0.0;

	// -------------------------------------------------------
	// Calcul note automatique /20
	// Règles :
	// PRESENT = 20 pts
	// RETARD = 14 pts
	// ABSENT + justificatif ACCEPTE = 16 pts
	// ABSENT sans justificatif = 0 pts
	// Score = moyenne sur les jours Lun-Ven du mois
	// -------------------------------------------------------
	public NoteMensuelle calculerNoteAuto(Utilisateur utilisateur, int mois, int annee) {

		LocalDate debut = LocalDate.of(annee, mois, 1);
		LocalDate fin = debut.plusMonths(1);
		LocalDate dateCourante = debut;

		List<Presence> presences = presenceRepo.findByUtilisateurAndPeriode(utilisateur, debut, fin);

		// Associer chaque date à sa présence
		Map<LocalDate, Presence> presencesParJour =
		        presences.stream()
		                .collect(Collectors.toMap(
		                        Presence::getDatePresence,
		                        presence -> presence,
		                        (anciennePresence, nouvellePresence) -> anciennePresence
		                ));

		int joursOuvrables = compterJoursOuvrables(mois, annee);

		double totalPoints = 0;

		// On ne calcule jamais les jours futurs
		LocalDate aujourdHui = LocalDate.now();

		LocalDate derniereDateAEvaluer = fin.minusDays(1);

		if (derniereDateAEvaluer.isAfter(aujourdHui)) {
			derniereDateAEvaluer = aujourdHui;
		}

		

		while (!dateCourante.isAfter(derniereDateAEvaluer)) {

			DayOfWeek jourSemaine = dateCourante.getDayOfWeek();

			// Ignorer les week-ends
			if (jourSemaine != DayOfWeek.SATURDAY && jourSemaine != DayOfWeek.SUNDAY) {

				Presence presenceDuJour = presencesParJour.get(dateCourante);

				// Aucun pointage
				if (presenceDuJour == null) {

					totalPoints += POINT_ABSENCE_INJUSTIFIEE;

				} else {

					switch (presenceDuJour.getStatutPresence()) {

					case PRESENT -> totalPoints += POINT_PRESENT;

					case RETARD -> totalPoints += POINT_RETARD;

					case ABSENT -> {

						boolean justificatifAccepte = justificatifRepo
								.findByUtilisateurOrderByDateCreationDesc(utilisateur).stream().anyMatch(
										j -> j.getStatut() == StatutJustificatif.ACCEPTE && j.getDateCreation() != null
												&& dateCourante.compareTo(j.getDateDebut()) >= 0
												        &&
												        dateCourante.compareTo(j.getDateFin()) <= 0);

						totalPoints += justificatifAccepte ? POINT_ABSENCE_JUSTIFIEE : POINT_ABSENCE_INJUSTIFIEE;
					}

					}

				}
				
			}

	       dateCourante = dateCourante.plusDays(1);   

		}

		double noteAuto;

		if (joursOuvrables == 0) {

			noteAuto = 0;

		} else {

			noteAuto = totalPoints / joursOuvrables;

		}

		noteAuto = Math.round(noteAuto * 100.0) / 100.0;
		Optional<NoteMensuelle> existante = noteRepo.findByUtilisateurAndMoisAndAnnee(utilisateur, mois, annee);

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
	public NoteMensuelle saisirNoteManuelle(Utilisateur utilisateur, int mois, int annee, double noteManuelle,
			Utilisateur evaluateur) {

		if (noteManuelle < 0 || noteManuelle > 20) {
			throw new RuntimeException("La note doit être entre 0 et 20.");
		}

		Optional<NoteMensuelle> existante = noteRepo.findByUtilisateurAndMoisAndAnnee(utilisateur, mois, annee);

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
		String nomEvaluateur = evaluateur.getPrenom() + " " + evaluateur.getNom();
		String moisStr = obtenirNomMois(mois) + " " + annee;
		notificationService.creerNotification(utilisateur, "Note mensuelle",
				nomEvaluateur + " vous a attribué une note de " + noteManuelle + "/20 pour " + moisStr + ".");

		return sauvegardee;
	}

	// -------------------------------------------------------
	// Classement agents d'un service
	// -------------------------------------------------------
	public List<NoteMensuelle> getClassementAgentsService(Long serviceId, int mois, int annee) {
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
	public List<NoteMensuelle> getHistoriqueUtilisateur(Utilisateur utilisateur) {
		return noteRepo.findByUtilisateurOrderByAnneeDescMoisDesc(utilisateur);
	}

	// -------------------------------------------------------
	// Utilitaires
	// -------------------------------------------------------

	private int compterJoursOuvrables(int mois, int annee) {

		LocalDate debut = LocalDate.of(annee, mois, 1);
		LocalDate fin = debut.withDayOfMonth(debut.lengthOfMonth());

		LocalDate aujourdHui = LocalDate.now();

		// Pour un mois futur
		if (debut.isAfter(aujourdHui)) {
			return 0;
		}

		// Pour le mois en cours
		if (fin.isAfter(aujourdHui)) {
			fin = aujourdHui;
		}

		int count = 0;
		LocalDate current = debut;

		while (!current.isAfter(fin)) {

			java.time.DayOfWeek jour = current.getDayOfWeek();

			if (jour != java.time.DayOfWeek.SATURDAY && jour != java.time.DayOfWeek.SUNDAY) {

				count++;
			}

			current = current.plusDays(1);
		}

		return count;
	}
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