package com.monprojet.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.monprojet.entity.RapportPdf;

public interface RapportPdfRepository
        extends JpaRepository<RapportPdf, Long> {

    List<RapportPdf> findAllByOrderByDateGenerationDesc();

}