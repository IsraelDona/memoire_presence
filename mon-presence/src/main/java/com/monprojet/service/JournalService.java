package com.monprojet.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.monprojet.entity.Journal;
import com.monprojet.repository.JournalRepository;

@Service
public class JournalService {

    private final JournalRepository journalRepository;

    public JournalService(
            JournalRepository journalRepository) {

        this.journalRepository =
                journalRepository;
    }

    /*
     * Ajouter un journal
     */
    public void ajouter(
            String utilisateur,
            String action,
            String categorie,
            String resultat) {

        Journal journal =
                new Journal();

        journal.setDateAction(
                LocalDateTime.now());

        journal.setUtilisateur(
                utilisateur);

        journal.setAction(
                action);

        journal.setCategorie(
                categorie);

        journal.setResultat(
                resultat);

        journalRepository.save(journal);
    }

    /*
     * Tous les journaux
     */
    public List<Journal>
    getTousLesJournaux() {

        return journalRepository.findAllByOrderByDateActionDesc();
    }

}