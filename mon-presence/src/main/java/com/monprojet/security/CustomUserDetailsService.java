package com.monprojet.security;

import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import com.monprojet.entity.Utilisateur;
import com.monprojet.repository.UtilisateurRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    public CustomUserDetailsService(
            UtilisateurRepository utilisateurRepository) {

        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        Utilisateur utilisateur = utilisateurRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Utilisateur introuvable"));

        /*
         * Liste des autorités de l'utilisateur.
         */
        List<SimpleGrantedAuthority> authorities =
                new ArrayList<>();

        /*
         * Autorité correspondant au rôle principal.
         *
         * Exemple :
         * CHEF_SERVICE
         * DIRECTEUR
         * AGENT
         */
        authorities.add(
                new SimpleGrantedAuthority(
                        utilisateur.getRole()
                                   .getNomRole()
                                   .name()
                )
        );

        return new User(
                utilisateur.getEmail(),
                utilisateur.getMotDePasse(),
                authorities
        );
    }
}