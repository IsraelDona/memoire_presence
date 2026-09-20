package com.monprojet.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.monprojet.entity.Mission;
import com.monprojet.entity.Utilisateur;

public interface MissionRepository
        extends JpaRepository<Mission, Long> {

    @Query("SELECT m FROM Mission m JOIN m.participants p "
            + "WHERE p = :utilisateur "
            + "AND m.dateMission >= :debut AND m.dateMission < :fin")
    List<Mission> findByParticipantAndJour(
            @Param("utilisateur") Utilisateur utilisateur,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin);
}