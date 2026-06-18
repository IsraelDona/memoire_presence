package com.monprojet.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.monprojet.entity.RapportMensuel;
import com.monprojet.enums.StatutPresence;
import com.monprojet.repository.PresenceRepository;
import com.monprojet.repository.RapportMensuelRepository;
import com.monprojet.repository.UtilisateurRepository;

@Service
public class RapportMensuelService {

    private final RapportMensuelRepository
            rapportRepository;

    private final PresenceRepository
            presenceRepository;

    private final UtilisateurRepository
            utilisateurRepository;

    public RapportMensuelService(
            RapportMensuelRepository rapportRepository,
            PresenceRepository presenceRepository,
            UtilisateurRepository utilisateurRepository) {

        this.rapportRepository =
                rapportRepository;

        this.presenceRepository =
                presenceRepository;

        this.utilisateurRepository =
                utilisateurRepository;
    }

    public RapportMensuel genererRapportMensuel() {

        long nombreAgents =
                utilisateurRepository.count();

        long nombrePresences =
                presenceRepository.count();

        long nombreRetards =
                presenceRepository.countByStatutPresence(
                        StatutPresence.RETARD
                );

        double scoreMoyen;

        if (nombrePresences == 0) {

            scoreMoyen = 0;

        } else {

            scoreMoyen =
                    ((double)
                            (nombrePresences
                                    - nombreRetards)
                            / nombrePresences)
                            * 100;
        }

        RapportMensuel rapport =
                new RapportMensuel();

        rapport.setMois(
                LocalDate.now().getMonthValue()
        );

        rapport.setAnnee(
                LocalDate.now().getYear()
        );

        rapport.setNombreAgents(
                nombreAgents
        );

        rapport.setNombrePresences(
                nombrePresences
        );

        rapport.setNombreRetards(
                nombreRetards
        );

        rapport.setScoreMoyenPonctualite(
                scoreMoyen
        );

        rapport.setDateGeneration(
                LocalDate.now()
        );

        return rapportRepository.save(
                rapport
        );
    }

    public List<RapportMensuel>
    getTousLesRapports() {

        return rapportRepository.findAll();
    }
}