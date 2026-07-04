package com.monprojet.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.monprojet.entity.Role;
import com.monprojet.entity.Service;
import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.RoleName;
import com.monprojet.repository.RoleRepository;
import com.monprojet.repository.ServiceRepository;
import com.monprojet.repository.UtilisateurRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final ServiceRepository serviceRepository;

    public DataInitializer(
            RoleRepository roleRepository,
            UtilisateurRepository utilisateurRepository,
            PasswordEncoder passwordEncoder,
            ServiceRepository serviceRepository) {

        this.roleRepository = roleRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
        this.serviceRepository = serviceRepository;
    }

    @Override
    public void run(String... args) throws Exception {

        // ====================================
        // CREATION ROLE ADMINISTRATEUR
        // ====================================

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

        if (utilisateurRepository
                .findByEmail("admin@dgb.com")
                .isEmpty()) {

            Role roleAdmin =
                    roleRepository
                    .findByNomRole(RoleName.ADMINISTRATEUR)
                    .orElseThrow();

            Utilisateur admin = new Utilisateur();
            admin.setNom("ADMIN");
            admin.setPrenom("DGB");
            admin.setEmail("admin@dgb.com");
            admin.setMotDePasse(
                    passwordEncoder.encode("admin123")
            );
            admin.setActif(true);
            admin.setRole(roleAdmin);

            utilisateurRepository.save(admin);

            System.out.println("ADMIN CREE AVEC SUCCES");
        }

        // ====================================
        // CREATION DES SERVICES PAR DEFAUT
        // ====================================

        if (serviceRepository.count() == 0) {
            serviceRepository.save(new Service("Secrétariat de la Direction de l'Informatique (S/DI)"));
            serviceRepository.save(new Service("Service Génie Logiciel (SGL)"));
            serviceRepository.save(new Service("Service Administration des Bases de Données (SABD)"));
            serviceRepository.save(new Service("Service Systèmes et Réseaux (SSR)"));
            serviceRepository.save(new Service("Service Exploitation et Assistance aux Utilisateurs (SEAU)"));

            System.out.println("SERVICES PAR DEFAUT CREES AVEC SUCCES");
        }
    }
}