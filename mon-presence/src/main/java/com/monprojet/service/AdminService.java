package com.monprojet.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import com.monprojet.dto.CreateChefServiceRequest;
import com.monprojet.dto.ValidationCompteRequest;
import com.monprojet.entity.Role;
import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.RoleName;
import com.monprojet.repository.RoleRepository;
import com.monprojet.repository.UtilisateurRepository;

@Service
public class AdminService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final NotificationService notificationService;

    @Value("${app.mail.from}")
    private String mailFrom;

    public AdminService(
            UtilisateurRepository utilisateurRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JavaMailSender mailSender,
            NotificationService notificationService) {

        this.utilisateurRepository = utilisateurRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
        this.notificationService = notificationService;
    }

    /*
     * Voir toutes les demandes de comptes agents
     */
    public List<Utilisateur> getDemandesComptes() {
        return utilisateurRepository.findByActifFalse();
    }

    /*
     * Valider ou refuser une demande de compte
     */
    public String traiterDemandeCompte(
            ValidationCompteRequest request) {

        if (request == null
                || request.getUtilisateurId() == null) {
            return "Requête invalide";
        }

        Utilisateur utilisateur = utilisateurRepository
                .findById(request.getUtilisateurId())
                .orElse(null);

        if (utilisateur == null) {
            return "Utilisateur introuvable";
        }

        /*
         * Si admin accepte le compte
         */
        if (request.isAccepter()) {

            utilisateur.setActif(true);
            utilisateurRepository.save(utilisateur);

            /*
             * Notification interne à l'agent
             */
            notificationService.creerNotification(
                    utilisateur,
                    "Compte validé",
                    "Votre compte a été validé par l'administrateur."
            );

            /*
             * Email à l'agent
             */
            envoyerEmailValidation(utilisateur);

            return "Compte validé avec succès";
        }

        /*
         * Si admin refuse le compte
         * Aucune notification (compte supprimé)
         * Email de refus uniquement
         */
        envoyerEmailRefus(utilisateur);

        utilisateurRepository.delete(utilisateur);

        return "Compte refusé et supprimé";
    }

    /*
     * Création d'un chef service
     */
    public String creerChefService(
            CreateChefServiceRequest request) {

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

        if (utilisateurRepository.existsByEmail(
                request.getEmail())) {
            return "Email déjà utilisé";
        }

        Role roleChef = roleRepository
                .findByNomRole(RoleName.CHEF_SERVICE)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Rôle CHEF_SERVICE introuvable"));

        Utilisateur chef = new Utilisateur();
        chef.setNom(request.getNom());
        chef.setPrenom(request.getPrenom());
        chef.setEmail(request.getEmail());
        chef.setMotDePasse(
                passwordEncoder.encode(
                        request.getMotDePasse()));
        chef.setActif(true);
        chef.setRole(roleChef);

        utilisateurRepository.save(chef);

        envoyerEmailChefService(request);

        return "Chef service créé avec succès";
    }

    /*
     * Email validation compte agent
     */
    private void envoyerEmailValidation(
            Utilisateur utilisateur) {

        SimpleMailMessage message =
                new SimpleMailMessage();

        message.setFrom(mailFrom);
        message.setTo(utilisateur.getEmail());
        message.setSubject(
                "Votre compte a été validé");

        message.setText(
                "Bonjour "
                + utilisateur.getPrenom()
                + " "
                + utilisateur.getNom()
                + ",\n\n"
                + "Votre compte a été validé "
                + "par l'administrateur.\n\n"
                + "Vous pouvez maintenant vous connecter "
                + "à la plateforme e-presence DGB.\n\n"
                + "Administration DGB"
        );

        mailSender.send(message);
    }

    /*
     * Email refus compte agent
     */
    private void envoyerEmailRefus(
            Utilisateur utilisateur) {

        SimpleMailMessage message =
                new SimpleMailMessage();

        message.setFrom(mailFrom);
        message.setTo(utilisateur.getEmail());
        message.setSubject(
                "Votre demande de compte a été refusée");

        message.setText(
                "Bonjour "
                + utilisateur.getPrenom()
                + " "
                + utilisateur.getNom()
                + ",\n\n"
                + "Votre demande de compte a été refusée "
                + "par l'administrateur.\n\n"
                + "Pour toute question, "
                + "contactez l'administration DGB.\n\n"
                + "Administration DGB"
        );

        mailSender.send(message);
    }

    /*
     * Email création chef service
     */
    private void envoyerEmailChefService(
            CreateChefServiceRequest request) {

        SimpleMailMessage message =
                new SimpleMailMessage();

        message.setFrom(mailFrom);
        message.setTo(request.getEmail());
        message.setSubject(
                "Création de votre compte chef service");

        message.setText(
                "Bonjour "
                + request.getPrenom()
                + " "
                + request.getNom()
                + ",\n\n"
                + "Votre compte chef service a été créé.\n\n"
                + "Email : "
                + request.getEmail()
                + "\n"
                + "Mot de passe : "
                + request.getMotDePasse()
                + "\n\n"
                + "Vous pouvez maintenant vous connecter "
                + "à la plateforme e-presence DGB.\n\n"
                + "Administration DGB"
        );

        mailSender.send(message);
    }
    
}