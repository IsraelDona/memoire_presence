package com.monprojet.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.monprojet.dto.ReunionRequest;
import com.monprojet.entity.Reunion;
import com.monprojet.repository.ReunionRepository;
import com.monprojet.service.ReunionService;

@RestController
@RequestMapping("/api/reunions")
public class ReunionController {

    private final ReunionRepository reunionRepository;

    private final ReunionService reunionService;

    public ReunionController(
            ReunionRepository reunionRepository,
            ReunionService reunionService) {

        this.reunionRepository =
                reunionRepository;

        this.reunionService =
                reunionService;
    }

    @GetMapping
    public List<Reunion> getAll() {

        return reunionRepository.findAll();
    }

    @PostMapping
    public String creer(
            @RequestBody ReunionRequest request) {

        return reunionService
                .creerReunion(request);
    }
}