package com.monprojet.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.monprojet.entity.Reunion;

public interface ReunionRepository
        extends JpaRepository<Reunion, Long> {
}