package com.monprojet.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.monprojet.dto.StatistiqueGlobaleResponse;
import com.monprojet.service.StatistiqueGlobaleService;

@RestController
@RequestMapping("/api/admin")
public class StatistiqueGlobaleController {

    private final StatistiqueGlobaleService
            statistiqueGlobaleService;

    public StatistiqueGlobaleController(
            StatistiqueGlobaleService
                    statistiqueGlobaleService) {

        this.statistiqueGlobaleService =
                statistiqueGlobaleService;
    }

    @GetMapping("/statistiques-globales")
    public StatistiqueGlobaleResponse
    getStatistiquesGlobales() {

        return statistiqueGlobaleService
                .getStatistiquesGlobales();
    }
}