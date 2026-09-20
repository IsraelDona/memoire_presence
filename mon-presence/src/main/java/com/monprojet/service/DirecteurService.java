package com.monprojet.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.monprojet.entity.Utilisateur;
import com.monprojet.enums.RoleName;
import com.monprojet.repository.UtilisateurRepository;

@Service
public class DirecteurService {

    private final UtilisateurRepository utilisateurRepository;

    public DirecteurService(
            UtilisateurRepository utilisateurRepository) {

        this.utilisateurRepository = utilisateurRepository;
    }

    /*
     * =======================================================
     * RETOURNER LES CHEFS DE SERVICE ACTIFS
     * =======================================================
     */
    public List<Utilisateur> getChefsService() {

        return utilisateurRepository.findByActifTrue()
                .stream()
                .filter(utilisateur ->
                        utilisateur.getRole() != null
                        && utilisateur.getRole().getNomRole()
                                == RoleName.CHEF_SERVICE)
                .toList();
    }

}
