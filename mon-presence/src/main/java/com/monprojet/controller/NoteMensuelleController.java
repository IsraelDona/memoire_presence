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
    // AGENT/CHEF — Classement au sein de mon propre service
    // GET /api/notes/mon-classement-service
    //
    // Permet à chacun de situer sa position parmi ses collègues
    // du même service.
    // -------------------------------------------------------
    @GetMapping("/mon-classement-service")
    public ResponseEntity<List<NoteMensuelle>> monClassementService(
            @RequestParam int mois,
            @RequestParam int annee,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur utilisateur = utilisateurRepo
                .findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (utilisateur.getService() == null) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(noteService.getClassementAgentsService(
                utilisateur.getService().getId(), mois, annee));
    }

    // -------------------------------------------------------
    // CHEF — Classement de tous les chefs de service
    // GET /api/notes/classement-chefs
    //
    // Même donnée que la vue du directeur, ouverte aux chefs
    // pour qu'ils situent leur propre position.
    // -------------------------------------------------------
    @GetMapping("/classement-chefs")
    public ResponseEntity<List<NoteMensuelle>> classementChefsPourChef(
            @RequestParam int mois,
            @RequestParam int annee) {

        return ResponseEntity.ok(
                noteService.getClassementChefs(mois, annee));
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

        LocalDate aujourdHui = LocalDate.now();
        noteService.calculerNoteAuto(
                utilisateur, aujourdHui.getMonthValue(), aujourdHui.getYear());

        return ResponseEntity.ok(
                noteService.getHistoriqueUtilisateur(utilisateur));
    }
    @PostMapping("/directeur/calculer-chef/{chefId}")
    public ResponseEntity<NoteMensuelle> calculerNoteChefDirecteur(
            @PathVariable Long chefId,
            @RequestParam int mois,
            @RequestParam int annee) {

        Utilisateur chef = utilisateurRepo.findById(chefId)
                .orElseThrow(() ->
                        new RuntimeException("Chef introuvable"));

        if (chef.getRole() == null
                || chef.getRole().getNomRole()
                        != com.monprojet.enums.RoleName.CHEF_SERVICE) {

            throw new RuntimeException(
                    "Seul un chef de service peut être évalué par le Directeur."
            );
        }

        NoteMensuelle note =
                noteService.calculerNoteAuto(
                        chef,
                        mois,
                        annee
                );

        return ResponseEntity.ok(note);
    }
}