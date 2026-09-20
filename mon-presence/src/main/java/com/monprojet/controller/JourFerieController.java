package com.monprojet.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.monprojet.entity.JourFerie;
import com.monprojet.service.JoursFeriesService;

/*
 * Déclaration des jours fériés qui ne peuvent pas être calculés :
 * fêtes musulmanes (dates confirmées par communiqué officiel) et
 * journées chômées exceptionnelles.
 */
@RestController
@RequestMapping("/api/admin/jours-feries")
public class JourFerieController {

    private final JoursFeriesService joursFeriesService;

    public JourFerieController(JoursFeriesService joursFeriesService) {
        this.joursFeriesService = joursFeriesService;
    }

    @GetMapping
    public List<JourFerie> getJoursDeclares() {
        return joursFeriesService.getJoursDeclares();
    }

    @PostMapping
    public String declarer(@RequestBody Map<String, String> corps) {

        String dateBrute = corps.get("date");
        String libelle = corps.get("libelle");

        if (dateBrute == null || dateBrute.isBlank()) {
            return "Date obligatoire";
        }

        return joursFeriesService.declarerJourFerie(
                LocalDate.parse(dateBrute), libelle);
    }

    @DeleteMapping("/{id}")
    public String supprimer(@PathVariable Long id) {
        return joursFeriesService.supprimerJourFerie(id);
    }
}
