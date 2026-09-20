package com.monprojet.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.monprojet.entity.Journal;
import com.monprojet.service.JournalService;

@RestController
@RequestMapping("/api/admin/journaux")
@CrossOrigin("*")
public class JournalController {

    private final JournalService journalService;

    public JournalController(
            JournalService journalService) {

        this.journalService =
                journalService;
    }

    /*
     * Tous les journaux
     */
    @GetMapping
    public List<Journal>getTousLesJournaux() {

        return journalService.getTousLesJournaux();
    }

}