package com.monprojet.config;

/*
 * Permet d'exécuter du code automatiquement
 * au démarrage de Spring Boot
 */
import org.springframework.boot.CommandLineRunner;

/*
 * Utilisé pour encoder les mots de passe
 */
import org.springframework.security.crypto.password.PasswordEncoder;

/*
 * Indique que cette classe est un composant Spring
 */
import org.springframework.stereotype.Component;

import com.monprojet.entity.Role;
import com.monprojet.entity.Utilisateur;

import com.monprojet.enums.RoleName;

import com.monprojet.repository.RoleRepository;
import com.monprojet.repository.UtilisateurRepository;

/*
 * Spring détecte automatiquement cette classe
 */
@Component
public class DataInitializer implements CommandLineRunner {

    /*
     * Repository des rôles
     */
    private final RoleRepository roleRepository;

    /*
     * Repository des utilisateurs
     */
    private final UtilisateurRepository utilisateurRepository;

    /*
     * Encodeur BCrypt
     */
    private final PasswordEncoder passwordEncoder;

    /*
     * Constructeur
     */
    public DataInitializer(
            RoleRepository roleRepository,
            UtilisateurRepository utilisateurRepository,
            PasswordEncoder passwordEncoder) {

        this.roleRepository = roleRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /*
     * Cette méthode s'exécute automatiquement
     * au démarrage du projet
     */
    @Override
    public void run(String... args) throws Exception {

        // ====================================
        // CREATION ROLE ADMINISTRATEUR
        // ====================================

        /*
         * Vérifie si le rôle ADMIN existe déjà
         */
        if (roleRepository
                .findByNomRole(RoleName.ADMINISTRATEUR)
                .isEmpty()) {

            Role adminRole = new Role();

            adminRole.setNomRole(RoleName.ADMINISTRATEUR);

            roleRepository.save(adminRole);
        }

        // ====================================
        // CREATION ROLE CHEF SERVICE
        // ====================================

        if (roleRepository
                .findByNomRole(RoleName.CHEF_SERVICE)
                .isEmpty()) {

            Role chefRole = new Role();

            chefRole.setNomRole(RoleName.CHEF_SERVICE);

            roleRepository.save(chefRole);
        }

        // ====================================
        // CREATION ROLE AGENT
        // ====================================

        if (roleRepository
                .findByNomRole(RoleName.AGENT)
                .isEmpty()) {

            Role agentRole = new Role();

            agentRole.setNomRole(RoleName.AGENT);

            roleRepository.save(agentRole);
        }

        // ====================================
        // CREATION ADMIN PRINCIPAL
        // ====================================

        /*
         * Vérifie si admin existe déjà
         */
        if (utilisateurRepository
                .findByEmail("admin@dgb.com")
                .isEmpty()) {

            /*
             * Recherche le rôle admin
             */
            Role roleAdmin =
                    roleRepository
                    .findByNomRole(RoleName.ADMINISTRATEUR)
                    .orElseThrow();

            /*
             * Création utilisateur admin
             */
            Utilisateur admin = new Utilisateur();

            admin.setNom("ADMIN");

            admin.setPrenom("DGB");

            admin.setEmail("admin@dgb.com");

            /*
             * Encodage mot de passe
             */
            admin.setMotDePasse(
                    passwordEncoder.encode("admin123")
            );

            /* Admin actif immédiatement*/
            admin.setActif(true);

            /*
             * Attribution rôle admin
             */
            admin.setRole(roleAdmin);

            /*
             * Sauvegarde en base
             */
            utilisateurRepository.save(admin);

            System.out.println("ADMIN CREE AVEC SUCCES");
        }
    }
}