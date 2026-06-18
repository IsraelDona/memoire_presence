package com.monprojet.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.monprojet.entity.RapportMensuel;
import com.monprojet.service.RapportMensuelService;

@RestController
@RequestMapping("/api/rapports")
public class RapportMensuelController {

    private final RapportMensuelService
            rapportMensuelService;

    public RapportMensuelController(
            RapportMensuelService rapportMensuelService) {

        this.rapportMensuelService =
                rapportMensuelService;
    }

    @PostMapping("/generer")
    public RapportMensuel genererRapport() {

        return rapportMensuelService
                .genererRapportMensuel();
    }

    @GetMapping
    public List<RapportMensuel>
    getTousLesRapports() {

        return rapportMensuelService
                .getTousLesRapports();
    }
}