package com.monprojet.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.monprojet.dto.UpdateProfilRequest;
import com.monprojet.entity.Utilisateur;
import com.monprojet.service.ProfilService;

import com.monprojet.dto.UpdatePhotoProfilRequest;
@RestController
@RequestMapping("/api/profil")
@CrossOrigin("*")
public class ProfilController {

    private final ProfilService profilService;

    public ProfilController(ProfilService profilService) {
        this.profilService = profilService;
    }

    /*
     * GET /api/profil
     * Récupérer son profil
     */
    @GetMapping
    public ResponseEntity<Utilisateur> getProfil() {
        return ResponseEntity.ok(
                profilService.getMonProfil());
    }

    /*
     * PATCH /api/profil
     * Modifier son profil
     */
    @PatchMapping
    public ResponseEntity<?> modifierProfil(
            @RequestBody UpdateProfilRequest request) {
        
    	Utilisateur utilisateur =
    	        profilService.modifierProfil(request);

    	return ResponseEntity.ok(utilisateur);
    }
    @PatchMapping("/photo")
    public ResponseEntity<Utilisateur>
    modifierPhotoProfil(
            @RequestBody
            UpdatePhotoProfilRequest request) {

        return ResponseEntity.ok(
                profilService
                        .modifierPhotoProfil(
                                request));
    }
}