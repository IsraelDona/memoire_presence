package com.monprojet.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.monprojet.entity.Mission;

public interface MissionRepository
        extends JpaRepository<Mission, Long> {
}