package com.monprojet.security;

import java.security.Key;
import java.util.Date;

import org.springframework.stereotype.Service;

import com.monprojet.entity.Utilisateur;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private static final String SECRET =
            "monprojetjwtsecretmonprojetjwtsecret123456";

    private final Key key =
            Keys.hmacShaKeyFor(SECRET.getBytes());

    /*
     * Génération token
     */
    public String generateToken(Utilisateur utilisateur) {

        return Jwts.builder()

                .setSubject(utilisateur.getEmail())

                .claim(
                        "role",
                        utilisateur.getRole()
                                   .getNomRole()
                                   .name()
                )

                .setIssuedAt(new Date())

                .setExpiration(
                        new Date(
                                System.currentTimeMillis()
                                        + 1000 * 60 * 60 * 24
                        )
                )

                .signWith(key, SignatureAlgorithm.HS256)

                .compact();
    }

    /*
     * Extraire email du token
     */
    public String extractUsername(String token) {

        return extractAllClaims(token)
                .getSubject();
    }

    /*
     * Vérifier token valide
     */
    public boolean isTokenValid(String token) {

        try {

            extractAllClaims(token);

            return true;

        } catch (Exception e) {

            return false;
        }
    }

    /*
     * Lire contenu token
     */
    private Claims extractAllClaims(String token) {

        return Jwts.parserBuilder()

                .setSigningKey(key)

                .build()

                .parseClaimsJws(token)

                .getBody();
    }
}