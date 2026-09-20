package com.monprojet.service;

import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import com.monprojet.dto.CreateChefServiceRequest;
import com.monprojet.dto.ValidationCompteRequest;
import com.monprojet.entity.Affectation;
import com.monprojet.entity.Role;
import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.RoleName;
import com.monprojet.repository.AffectationRepository;
import com.monprojet.repository.RoleRepository;
import com.monprojet.repository.UtilisateurRepository;

import java.time.LocalDateTime;

@Service
public class AdminService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final NotificationService notificationService;
    private final JournalService journalService;

    @Value("${app.mail.from}")
    private String mailFrom;

    private final com.monprojet.repository.ServiceRepository serviceRepository;
    private final AffectationRepository affectationRepository;

    public AdminService(
            UtilisateurRepository utilisateurRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JavaMailSender mailSender,
            NotificationService notificationService,
            com.monprojet.repository.ServiceRepository serviceRepository ,JournalService journalService,
            AffectationRepository affectationRepository) {

        this.utilisateurRepository = utilisateurRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
        this.notificationService = notificationService;
        this.serviceRepository = serviceRepository;
        this.journalService = journalService;
        this.affectationRepository = affectationRepository;
    }

    /*
     * Clôture l'affectation en cours de l'agent puis en ouvre une
     * nouvelle. La colonne service_id de l'utilisateur reste mise à
     * jour en parallèle : elle porte le service courant, la table
     * affectations porte l'historique.
     */
    private void enregistrerAffectation(
            Utilisateur utilisateur,
            com.monprojet.entity.Service service) {

        LocalDateTime maintenant = LocalDateTime.now();

        affectationRepository
                .findByUtilisateurAndActifTrue(utilisateur)
                .ifPresent(precedente -> {
                    precedente.setDateFin(maintenant);
                    precedente.setActif(false);
                    affectationRepository.save(precedente);
                });

        affectationRepository.save(
                new Affectation(utilisateur, service, maintenant));
    }
    private String getNomUtilisateurConnecte() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String email = authentication.getName();

        Utilisateur utilisateur =
                utilisateurRepository
                        .findByEmail(email)
                        .orElse(null);

        if (utilisateur == null) {
            return "Inconnu";
        }

        return utilisateur.getNom() + " " + utilisateur.getPrenom();
    }    
    
    /*
     * Voir toutes les demandes de comptes agents
     */
    public List<Utilisateur> getDemandesComptes() {
        return utilisateurRepository.findByActifFalse();
    }

    /*
     * Personnel affectable à un service : agents et chefs de service.
     * Un chef de service est un agent (héritage du diagramme de
     * classes), il est donc lui aussi rattaché à un service et peut
     * être réaffecté.
     */
    public List<Utilisateur> getTousLesAgents() {
        return utilisateurRepository.findByActifTrue()
                .stream()
                .filter(utilisateur -> {
                    if (utilisateur.getRole() == null) {
                        return false;
                    }
                    RoleName role = utilisateur.getRole().getNomRole();
                    return role == RoleName.AGENT || role == RoleName.CHEF_SERVICE;
                })
                .toList();
    }

    /*
     * Met à jour les informations administratives d'un agent
     * (matricule, poste, grade). Un champ laissé vide est ignoré.
     */
    public String mettreAJourInfosAgent(
            com.monprojet.dto.InfosAgentRequest request) {

        if (request == null || request.getAgentId() == null) {
            return "Requête invalide";
        }

        Utilisateur agent =
                utilisateurRepository.findById(request.getAgentId()).orElse(null);

        if (agent == null) {
            return "Agent introuvable";
        }

        if (request.getMatricule() != null && !request.getMatricule().isBlank()) {
            agent.setMatricule(request.getMatricule().trim());
        }

        if (request.getPoste() != null && !request.getPoste().isBlank()) {
            agent.setPoste(request.getPoste().trim());
        }

        if (request.getGrade() != null && !request.getGrade().isBlank()) {
            agent.setGrade(request.getGrade().trim());
        }

        utilisateurRepository.save(agent);

        journalService.ajouter(
                getNomUtilisateurConnecte(),
                "Mise à jour des informations de "
                        + agent.getNom() + " " + agent.getPrenom(),
                "Compte",
                "Succès");

        return "Informations mises à jour";
    }

    /*
     * Historique des affectations d'un agent, de la plus récente
     * à la plus ancienne.
     */
    public List<Affectation> getHistoriqueAffectations(Long agentId) {

        if (agentId == null) {
            return List.of();
        }

        return utilisateurRepository.findById(agentId)
                .map(affectationRepository::findByUtilisateurOrderByDateDebutDesc)
                .orElse(List.of());
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
             * Ouvre la première affectation : l'historique démarre à
             * l'activation du compte, pas au premier changement.
             */
            if (utilisateur.getService() != null) {
                enregistrerAffectation(utilisateur, utilisateur.getService());
            }

            journalService.ajouter(getNomUtilisateurConnecte(),
                    "Validation du compte de " + utilisateur.getNom() + " " + utilisateur.getPrenom(),"Compte","Succès");

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
            try {
                envoyerEmailValidation(utilisateur);
            } catch (Exception e) {
                System.err.println("Email non envoyé : " + e.getMessage());
            }

            return "Compte validé avec succès";
        }

        /*
         * Si admin refuse le compte
         * Aucune notification (compte supprimé)
         * Email de refus uniquement
         */
        try {
            envoyerEmailRefus(utilisateur);
        } catch (Exception e) {
            System.err.println("Email non envoyé : " + e.getMessage());
        }

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

        if (request.getServiceId() == null) {
            return "Le service est obligatoire pour créer un chef de service";
        }

        boolean serviceDejaAttribue = utilisateurRepository
                .findByServiceId(request.getServiceId())
                .stream()
                .anyMatch(u -> u.getRole().getNomRole() == RoleName.CHEF_SERVICE);

        if (serviceDejaAttribue) {
            return "Ce service a déjà un chef de service assigné.";
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

        serviceRepository.findById(request.getServiceId())
        .ifPresent(chef::setService);

        utilisateurRepository.save(chef);

        if (chef.getService() != null) {
            enregistrerAffectation(chef, chef.getService());
        }

        journalService.ajouter(getNomUtilisateurConnecte(),"Création du chef de service " + chef.getNom() + " " + chef.getPrenom(),"Compte","Succès");

        envoyerEmailChefService(request);
        
        notificationService.creerNotification(
                chef,
                "Bienvenue sur e-presence DGB",
                "Votre compte chef de service a été créé avec succès."
        );

        // Notifier aussi l'admin connecté
        utilisateurRepository
                .findFirstByRoleNomRole(RoleName.ADMINISTRATEUR)
                .ifPresent(admin ->
                        notificationService.creerNotification(
                                admin,
                                "Chef service créé",
                                "Le compte chef de service "
                                + request.getPrenom()
                                + " "
                                + request.getNom()
                                + " a été créé avec succès."
                        )
                );

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

    /*
     * Affecter un agent (ou chef de service) à un autre service.
     */
    public String affecterAgentAService(Long agentId, Long serviceId) {

        if (agentId == null || serviceId == null) {
            return "Requête invalide";
        }

        Utilisateur agent =
                utilisateurRepository.findById(agentId).orElse(null);

        if (agent == null) {
            return "Agent introuvable";
        }

        com.monprojet.entity.Service service =
                serviceRepository.findById(serviceId).orElse(null);

        if (service == null) {
            return "Service introuvable";
        }

        String ancienService =
                agent.getService() != null
                        ? agent.getService().getNom()
                        : "aucun service";

        agent.setService(service);
        utilisateurRepository.save(agent);

        enregistrerAffectation(agent, service);

        journalService.ajouter(
                getNomUtilisateurConnecte(),
                "Affectation de " + agent.getNom() + " " + agent.getPrenom()
                        + " du service " + ancienService
                        + " vers " + service.getNom(),
                "Compte",
                "Succès"
        );

        notificationService.creerNotification(
                agent,
                "Changement de service",
                "Vous avez été affecté au service "
                        + service.getNom()
                        + " par l'administrateur."
        );

        return "Agent affecté au service " + service.getNom() + " avec succès";
    }
    
}