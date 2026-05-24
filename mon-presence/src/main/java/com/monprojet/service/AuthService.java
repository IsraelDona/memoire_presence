package com.monprojet.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public AuthService(
            UtilisateurRepository utilisateurRepository,
            RoleRepository roleRepository,
            JwtService jwtService
    ) {

        this.utilisateurRepository = utilisateurRepository;
        this.roleRepository = roleRepository;
        this.jwtService = jwtService;
    }

    // ==========================
    // INSCRIPTION AGENT
    // ==========================
    public String inscrireAgent(RegisterRequest request) {

        if (request == null) {
            return "Requête invalide";
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
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
                passwordEncoder.encode(request.getMotDePasse())
        );

        utilisateur.setRole(roleAgent);

        // compte inactif tant que admin ne valide pas
        utilisateur.setActif(false);

        utilisateurRepository.save(utilisateur);

        return "Demande d'inscription envoyée à l'administrateur";
    }

    // ==========================
    // LOGIN JWT
    // ==========================
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

        // compte non validé
        if (!utilisateur.isActif()) {
            throw new RuntimeException(
                    "Compte non validé par l'administrateur"
            );
        }

        // vérification mot de passe
        boolean passwordCorrect = passwordEncoder.matches(
                request.getMotDePasse(),
                utilisateur.getMotDePasse()
        );

        if (!passwordCorrect) {
            throw new RuntimeException("Mot de passe incorrect");
        }

        // génération JWT
        String token = jwtService.generateToken(utilisateur);

        // réponse envoyée au front
        return new LoginResponse(
                token,
                utilisateur.getRole().getNomRole().name(),
                utilisateur.getNom(),
                utilisateur.getEmail()
        );
    }

    // ==========================
    // ROLE
    // ==========================
    private Role getOrCreateRole(RoleName roleName) {

        return roleRepository
                .findByNomRole(roleName)
                .orElseGet(() ->
                        roleRepository.save(
                                new Role(roleName)
                        )
                );
    }
}