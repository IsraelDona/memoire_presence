package com.monprojet.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.monprojet.entity.Reunion;
import com.monprojet.entity.Utilisateur;

public interface ReunionRepository
        extends JpaRepository<Reunion, Long> {

    @Query("SELECT r FROM Reunion r JOIN r.participants p "
            + "WHERE p = :utilisateur "
            + "AND r.dateReunion >= :debut AND r.dateReunion < :fin")
    List<Reunion> findByParticipantAndJour(
            @Param("utilisateur") Utilisateur utilisateur,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin);
}