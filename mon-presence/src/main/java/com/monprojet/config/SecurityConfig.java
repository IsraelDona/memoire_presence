package com.monprojet.config;

import java.util.List;

import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import com.monprojet.security.JwtAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtFilter) {

        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http

            .cors(Customizer.withDefaults())

            .csrf(csrf -> csrf.disable())

            .sessionManagement(session ->
                    session.sessionCreationPolicy(
                            SessionCreationPolicy.STATELESS
                    )
            )

            .authorizeHttpRequests(auth -> auth

                    .requestMatchers(HttpMethod.OPTIONS, "/**")
                    .permitAll()

                    .requestMatchers("/api/auth/**")
                    .permitAll()

                    .requestMatchers("/api/services/**")
                    .permitAll()
                    /*
                     * DIRECTEUR
                     */
                    .requestMatchers("/api/directeur/**")
                    .hasAuthority("DIRECTEUR")

                    .requestMatchers(
                            HttpMethod.POST,
                            "/api/notes/directeur/calculer-chef/**"
                    )
                    .hasAuthority("DIRECTEUR")

                    .requestMatchers(
                            HttpMethod.GET,
                            "/api/admin/statistiques-globales"
                    )
                    .hasAnyAuthority("ADMINISTRATEUR", "DIRECTEUR")

                    .requestMatchers(
                            HttpMethod.GET,
                            "/api/admin/rapports-pdf",
                            "/api/admin/rapports-pdf/telecharger/**"
                    )
                    .hasAnyAuthority("ADMINISTRATEUR", "DIRECTEUR")

                    .requestMatchers(
                            HttpMethod.GET,
                            "/api/notes/admin/classement-chefs"
                    )
                    .hasAuthority("DIRECTEUR")

                    .requestMatchers(
                            HttpMethod.GET,
                            "/api/notes/admin/classement-agents"
                    )
                    .hasAnyAuthority("ADMINISTRATEUR", "DIRECTEUR")

                    .requestMatchers(
                            HttpMethod.POST,
                            "/api/notes/admin/noter/**"
                    )
                    .hasAuthority("DIRECTEUR")
                    
                    /*
                     * ADMIN
                     */
                    .requestMatchers(
                            "/api/notes/admin/classement-chefs",
                            "/api/notes/directeur/**"
                    ).hasAuthority("DIRECTEUR")

                    .requestMatchers("/api/notes/admin/**").hasAuthority("ADMINISTRATEUR")
                    .requestMatchers("/api/notes/chef/**").hasAuthority("CHEF_SERVICE")
                    .requestMatchers("/api/notes/mon-historique").authenticated()

                    /*
                     * Classements consultables par l'intéressé lui-même :
                     * un agent situe sa place dans son service, un chef
                     * situe la sienne parmi les chefs.
                     */
                    .requestMatchers("/api/notes/mon-classement-service").authenticated()
                    .requestMatchers("/api/notes/classement-chefs")
                    .hasAnyAuthority("CHEF_SERVICE", "ADMINISTRATEUR", "DIRECTEUR")

                    .requestMatchers("/api/admin/**").hasAuthority("ADMINISTRATEUR")
                    .requestMatchers("/api/admin/pdf/**").hasAuthority("ADMINISTRATEUR")

                    /*
                     * AGENT
                     */
                    .requestMatchers("/api/agent/**")
                    .hasAnyAuthority(
                            "AGENT",
                            "CHEF_SERVICE",
                            "ADMINISTRATEUR"
                    )

                    /*
                     * CHEF SERVICE
                     */
                    .requestMatchers("/api/chef/**")
                    .hasAnyAuthority(
                            "CHEF_SERVICE",
                            "ADMINISTRATEUR"
                    )
                    .requestMatchers("/api/chef-service/**")
                    .hasAuthority("CHEF_SERVICE")

                    /*
                     * Présences
                     */
                    .requestMatchers("/api/presences/**")
                    .authenticated()

                    /*
                     * Justificatifs
                     */
                    .requestMatchers("/api/justificatifs/**")
                    .authenticated()

                    /*
                     * Profil — tous les utilisateurs connectés
                     */
                    .requestMatchers("/api/profil/**")
                    .authenticated()

                    .anyRequest()
                    .authenticated()
            )

            .addFilterBefore(
                    jwtFilter,
                    UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of("http://localhost:3000")
        );

        configuration.setAllowedMethods(
        	    List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        	);

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}