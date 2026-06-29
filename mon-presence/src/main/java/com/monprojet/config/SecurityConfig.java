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
                     * ADMIN
                     */
                    .requestMatchers("/api/admin/**")
                    .hasAuthority("ADMINISTRATEUR")
                    .requestMatchers("/api/admin/pdf/**")
                    .hasAuthority("ADMINISTRATEUR")

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

                    /*
                     * GPS admin
                     */
                    .requestMatchers("/api/admin/gps/**")
                    .hasAuthority("ADMINISTRATEUR")
                    
                    
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