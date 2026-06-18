package com.monprojet.service;

import org.springframework.security.core.Authentication;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.monprojet.dto.FaceRegistrationRequest;
import com.monprojet.dto.LoginRequest;
import com.monprojet.dto.LoginResponse;
import com.monprojet.dto.RegisterRequest;
import com.monprojet.entity.Role;
import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.RoleName;
import com.monprojet.repository.RoleRepository;
import com.monprojet.repository.UtilisateurRepository;
import com.monprojet.security.JwtService;

@Service
@Transactional
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final NotificationService notificationService;

    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public AuthService(
            UtilisateurRepository utilisateurRepository,
            RoleRepository roleRepository,
            JwtService jwtService,
            NotificationService notificationService) {

        this.utilisateurRepository = utilisateurRepository;
        this.roleRepository = roleRepository;
        this.jwtService = jwtService;
        this.notificationService = notificationService;
    }

    /*
     * ==========================
     * INSCRIPTION AGENT
     * ==========================
     */
    public String inscrireAgent(RegisterRequest request) {

        if (request == null) {
            return "Requête invalide";
        }

        if (request.getEmail() == null
                || request.getEmail().isBlank()) {
            return "Email obligatoire";
        }

        if (request.getMotDePasse() == null
                || request.getMotDePasse().isBlank()) {
            return "Mot de passe obligatoire";
        }

        String email = request.getEmail().trim();

        if (utilisateurRepository.existsByEmail(email)) {
            return "Email déjà utilisé";
        }

        Role roleAgent = getOrCreateRole(RoleName.AGENT);

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(request.getNom());
        utilisateur.setPrenom(request.getPrenom());
        utilisateur.setEmail(email);
        utilisateur.setMotDePasse(
                passwordEncoder.encode(request.getMotDePasse()));
        utilisateur.setRole(roleAgent);

        utilisateur.setActif(false);

        utilisateurRepository.save(utilisateur);

        /*
         * Notification à l'admin unique
         */
        utilisateurRepository
                .findFirstByRoleNomRole(RoleName.ADMINISTRATEUR)
                .ifPresent(admin ->
                        notificationService.creerNotification(
                                admin,
                                "Nouvelle demande de compte",
                                "L'agent "
                                + utilisateur.getPrenom()
                                + " "
                                + utilisateur.getNom()
                                + " a soumis une demande de compte."
                        )
                );
    
        /*
         * PAS de notification à l'agent ici —
         * il n'est pas encore connecté
         * Son mail sera envoyé par AdminService
         * lors de la validation ou du refus
         */
        return "Demande d'inscription envoyée à l'administrateur";
    }

        /*
         * Compte inactif tant que admin ne valide pas
         */
        
       

  
    
  

    /*
     * ==========================
     * LOGIN JWT
     * ==========================
     */
    public LoginResponse login(LoginRequest request) {

        if (request == null) {
            throw new RuntimeException("Requête invalide");
        }

        if (request.getEmail() == null
                || request.getEmail().isBlank()) {
            throw new RuntimeException("Email obligatoire");
        }

        if (request.getMotDePasse() == null
                || request.getMotDePasse().isBlank()) {
            throw new RuntimeException("Mot de passe obligatoire");
        }

        String email = request.getEmail().trim();

        Utilisateur utilisateur = utilisateurRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Utilisateur introuvable"));

        /*
         * Compte non validé
         */
        if (!utilisateur.isActif()) {
            throw new RuntimeException(
                    "Compte non validé par l'administrateur");
        }

        /*
         * Vérification mot de passe
         */
        boolean passwordCorrect = passwordEncoder.matches(
                request.getMotDePasse(),
                utilisateur.getMotDePasse());

        if (!passwordCorrect) {
            throw new RuntimeException("Mot de passe incorrect");
        }

        /*
         * Génération JWT
         */
        String token = jwtService.generateToken(utilisateur);

        return new LoginResponse(
                token,
                utilisateur.getRole().getNomRole().name(),
                utilisateur.getNom(),
                utilisateur.getEmail(),
                utilisateur.isVisageEnregistre()
        );
    }

    /*
     * ==========================
     * ENREGISTREMENT VISAGE
     * ==========================
     */
    public String enregistrerVisage(
            FaceRegistrationRequest request) {

        if (request == null
                || request.getPhotoVisage() == null
                || request.getPhotoVisage().isBlank()) {
            return "Photo obligatoire";
        }

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {
            return "Utilisateur non authentifié";
        }

        String email = authentication.getName();

        Utilisateur utilisateur = utilisateurRepository
                .findByEmail(email)
                .orElse(null);

        if (utilisateur == null) {
            return "Utilisateur introuvable";
        }

        utilisateur.setPhotoVisage(request.getPhotoVisage());
        utilisateur.setVisageEnregistre(true);
        utilisateurRepository.save(utilisateur);

        return "Visage enregistré avec succès";
    }

    /*
     * ==========================
     * ROLE
     * ==========================
     */
    private Role getOrCreateRole(RoleName roleName) {

        return roleRepository
                .findByNomRole(roleName)
                .orElseGet(() ->
                        roleRepository.save(new Role(roleName)));
    }
}