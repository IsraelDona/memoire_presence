package com.monprojet.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.monprojet.entity.Utilisateur;
import com.monprojet.repository.UtilisateurRepository;

@Component
public class NoteAutomatiqueScheduler {

    private final NoteMensuelleService noteService;
    private final UtilisateurRepository utilisateurRepository;

    public NoteAutomatiqueScheduler(
            NoteMensuelleService noteService,
            UtilisateurRepository utilisateurRepository) {

        this.noteService = noteService;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Scheduled(cron = "0 0 23 * * *")
    public void calculerToutesLesNotes() {

        LocalDate aujourdHui = LocalDate.now();

        int mois = aujourdHui.getMonthValue();
        int annee = aujourdHui.getYear();

        List<Utilisateur> utilisateurs =
                utilisateurRepository.findAll();

        for (Utilisateur utilisateur : utilisateurs) {

            noteService.calculerNoteAuto(
                    utilisateur,
                    mois,
                    annee
            );
        }
    }
}