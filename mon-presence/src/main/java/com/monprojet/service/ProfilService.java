package com.monprojet.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.monprojet.dto.UpdateProfilRequest;
import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.RoleName;
import com.monprojet.repository.UtilisateurRepository;

import com.monprojet.dto.UpdatePhotoProfilRequest;

@Service
public class ProfilService {

    private final UtilisateurRepository utilisateurRepository;

    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();
    private final NotificationService notificationService;

    public ProfilService(
            UtilisateurRepository utilisateurRepository,
            NotificationService notificationService) {

        this.utilisateurRepository = utilisateurRepository;
        this.notificationService = notificationService;
    }

    /*
     * Modifier son propre visage_pointage
     */
    public Utilisateur modifierProfil(
            UpdateProfilRequest request) {

        Authentication auth =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(auth.getName())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Utilisateur introuvable"));

        if (request.getNom() != null
                && !request.getNom().isBlank()) {
            utilisateur.setNom(request.getNom());
        }

        if (request.getPrenom() != null
                && !request.getPrenom().isBlank()) {
            utilisateur.setPrenom(request.getPrenom());
        }

        if (request.getEmail() != null
                && !request.getEmail().isBlank()
                && !request.getEmail().equals(
                        utilisateur.getEmail())) {

        	if (utilisateurRepository.existsByEmail(
        	        request.getEmail())) {

        	    throw new RuntimeException(
        	            "Email déjà utilisé");
        	}
            
            utilisateur.setEmail(request.getEmail());
        }

        if (request.getMotDePasse() != null
                && !request.getMotDePasse().isBlank()) {
            utilisateur.setMotDePasse(
                    passwordEncoder.encode(
                            request.getMotDePasse()));
        }

        utilisateur = utilisateurRepository.save(utilisateur);

notificationService.creerNotification(
        utilisateur,
        "Profil mis à jour",
        "Les informations de votre compte ont été modifiées."
);

return utilisateur;
    }

    /*
     * Récupérer son propre visage_pointage
     */
    public Utilisateur getMonProfil() {

        Authentication auth =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        return utilisateurRepository
                .findByEmail(auth.getName())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Utilisateur introuvable"));
    }
    /*
     * Récupérer le chef de service qui dirige le
     * service de l'utilisateur connecté.
     *
     * Le chef de service n'est pas stocké sur Service
     * (jamais renseigné) : on le retrouve dynamiquement
     * via son rôle et son service_id.
     */
    public Utilisateur getMonChefService() {

        Utilisateur utilisateur = getMonProfil();

        if (utilisateur.getService() == null) {
            return null;
        }

        return utilisateurRepository
                .findFirstByServiceIdAndRoleNomRole(
                        utilisateur.getService().getId(),
                        RoleName.CHEF_SERVICE)
                .orElse(null);
    }

    /*
     * Modifier son propre profile
     */
    public Utilisateur modifierPhotoProfil(
            UpdatePhotoProfilRequest request) {

        Authentication auth =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(auth.getName())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Utilisateur introuvable"));

        utilisateur.setPhotoProfil(
                request.getPhotoProfil());

        return utilisateurRepository.save(
                utilisateur);
    }
}