package com.monprojet.controller;

import com.monprojet.entity.NoteMensuelle;
import com.monprojet.entity.Utilisateur;
import com.monprojet.repository.UtilisateurRepository;
import com.monprojet.service.NoteMensuelleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notes")
public class NoteMensuelleController {

    private final NoteMensuelleService noteService;
    private final UtilisateurRepository utilisateurRepo;

    public NoteMensuelleController(
            NoteMensuelleService noteService,
            UtilisateurRepository utilisateurRepo) {
        this.noteService = noteService;
        this.utilisateurRepo = utilisateurRepo;
    }

    // -------------------------------------------------------
    // ADMIN — Calculer note auto d'un utilisateur
    // POST /api/notes/admin/calculer/{userId}?mois=5&annee=2026
    // -------------------------------------------------------
    @PostMapping("/admin/calculer/{userId}")
    public ResponseEntity<NoteMensuelle> calculerNoteAdmin(
            @PathVariable Long userId,
            @RequestParam int mois,
            @RequestParam int annee) {

        Utilisateur utilisateur = utilisateurRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        NoteMensuelle note = noteService.calculerNoteAuto(utilisateur, mois, annee);
        return ResponseEntity.ok(note);
    }
 // CHEF — Calculer note auto d'un de ses agents
 // POST /api/notes/chef/calculer/{agentId}?mois=5&annee=2026
 @PostMapping("/chef/calculer/{agentId}")
 public ResponseEntity<NoteMensuelle> calculerNoteChef(
         @PathVariable Long agentId,
         @RequestParam int mois,
         @RequestParam int annee) {

     Utilisateur agent = utilisateurRepo.findById(agentId)
             .orElseThrow(() -> new RuntimeException("Agent introuvable"));
     NoteMensuelle note = noteService.calculerNoteAuto(agent, mois, annee);
     return ResponseEntity.ok(note);
 }

    // -------------------------------------------------------
    // ADMIN — Saisir note manuelle pour un chef
    // POST /api/notes/admin/noter/{chefId}
    // Body: { "mois": 5, "annee": 2026, "note": 17.5 }
    // -------------------------------------------------------
    @PostMapping("/admin/noter/{chefId}")
    public ResponseEntity<NoteMensuelle> noterChef(
            @PathVariable Long chefId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur chef = utilisateurRepo.findById(chefId)
                .orElseThrow(() -> new RuntimeException("Chef introuvable"));
        Utilisateur admin = utilisateurRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Admin introuvable"));

        int mois = (int) body.get("mois");
        int annee = (int) body.get("annee");
        double note = ((Number) body.get("note")).doubleValue();

        NoteMensuelle result = noteService.saisirNoteManuelle(
                chef, mois, annee, note, admin);
        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------
    // ADMIN — Classement global chefs
    // GET /api/notes/admin/classement-chefs?mois=5&annee=2026
    // -------------------------------------------------------
    @GetMapping("/admin/classement-chefs")
    public ResponseEntity<List<NoteMensuelle>> classementChefs(
            @RequestParam int mois,
            @RequestParam int annee) {
        return ResponseEntity.ok(noteService.getClassementChefs(mois, annee));
    }

    // -------------------------------------------------------
    // ADMIN — Classement global agents
    // GET /api/notes/admin/classement-agents?mois=5&annee=2026
    // -------------------------------------------------------
    @GetMapping("/admin/classement-agents")
    public ResponseEntity<List<NoteMensuelle>> classementAgents(
            @RequestParam int mois,
            @RequestParam int annee) {
        return ResponseEntity.ok(noteService.getClassementAgents(mois, annee));
    }

    // -------------------------------------------------------
    // CHEF — Saisir note manuelle pour un agent
    // POST /api/notes/chef/noter/{agentId}
    // Body: { "mois": 5, "annee": 2026, "note": 15.0 }
    // -------------------------------------------------------
    @PostMapping("/chef/noter/{agentId}")
    public ResponseEntity<NoteMensuelle> noterAgent(
            @PathVariable Long agentId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur agent = utilisateurRepo.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent introuvable"));
        Utilisateur chef = utilisateurRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Chef introuvable"));

        int mois = (int) body.get("mois");
        int annee = (int) body.get("annee");
        double note = ((Number) body.get("note")).doubleValue();

        NoteMensuelle result = noteService.saisirNoteManuelle(
                agent, mois, annee, note, chef);
        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------
    // CHEF — Classement de ses agents
    // GET /api/notes/chef/classement?mois=5&annee=2026
    // -------------------------------------------------------
    @GetMapping("/chef/classement")
    public ResponseEntity<List<NoteMensuelle>> classementAgentsChef(
            @RequestParam int mois,
            @RequestParam int annee,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur chef = utilisateurRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Chef introuvable"));

        if (chef.getService() == null) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(noteService.getClassementAgentsService(
                chef.getService().getId(), mois, annee));
    }

    // -------------------------------------------------------
    // AGENT/CHEF — Mon historique de notes
    // GET /api/notes/mon-historique
    // -------------------------------------------------------
    @GetMapping("/mon-historique")
    public ResponseEntity<List<NoteMensuelle>> monHistorique(
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur utilisateur = utilisateurRepo
                .findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        return ResponseEntity.ok(
                noteService.getHistoriqueUtilisateur(utilisateur));
    }
}