package com.monprojet.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.monprojet.entity.LieuBenin;
import com.monprojet.repository.LieuBeninRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lieux")
public class LieuController {

    private final LieuBeninRepository lieuBeninRepository;

    public LieuController(LieuBeninRepository lieuBeninRepository) {
        this.lieuBeninRepository = lieuBeninRepository;
    }

    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllLieux() {
        List<LieuBenin> lieux = lieuBeninRepository.findAll();
        List<Map<String, Object>> response = lieux.stream()
            .map(lieu -> {
                Map<String, Object> map = new HashMap<>();
                map.put("nom", lieu.getNom());
                map.put("latitude", lieu.getLatitude());
                map.put("longitude", lieu.getLongitude());
                return map;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/by-name/{name}")
    public ResponseEntity<Map<String, Object>> getLieuByName(@PathVariable String name) {
        Optional<LieuBenin> lieu = lieuBeninRepository.findByNomIgnoreCase(name);

        if (lieu.isPresent()) {
            Map<String, Object> response = new HashMap<>();
            response.put("nom", lieu.get().getNom());
            response.put("latitude", lieu.get().getLatitude());
            response.put("longitude", lieu.get().getLongitude());
            response.put("commune", lieu.get().getCommune());
            response.put("departement", lieu.get().getDepartement());
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.notFound().build();
    }
}
