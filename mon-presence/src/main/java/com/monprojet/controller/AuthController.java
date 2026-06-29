package com.monprojet.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.monprojet.dto.FaceRegistrationRequest;
import com.monprojet.dto.LoginRequest;
import com.monprojet.dto.LoginResponse;
import com.monprojet.dto.RegisterRequest;
import com.monprojet.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /*
     * ==========================
     * INSCRIPTION AGENT
     * ==========================
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(
            @RequestBody RegisterRequest request
    ) {

        String message = authService.inscrireAgent(request);

        if ("Demande d'inscription envoyée à l'administrateur"
                .equals(message)) {

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(Map.of("message", message));
        }

        return ResponseEntity
                .badRequest()
                .body(Map.of("message", message));
    }

    /*
     * ==========================
     * LOGIN JWT
     * ==========================
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request
    ) {

        try {

            LoginResponse response =
                    authService.login(request);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            String message = e.getMessage();

            if ("Compte non validé par l'administrateur"
                    .equals(message)) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", message));
            }

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", message));
        }
    }

    /*
     * ==========================
     * ENREGISTREMENT VISAGE
     * ==========================
     */
    @PostMapping("/register-face")
    public ResponseEntity<String> registerFace(
            @RequestBody FaceRegistrationRequest request
    ) {

        String message = authService.enregistrerVisage(request);

        if ("Visage enregistré avec succès"
                .equals(message)) {

            return ResponseEntity.ok(message);
        }

        return ResponseEntity
                .badRequest()
                .body(message);
    }
}