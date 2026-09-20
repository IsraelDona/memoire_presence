package com.monprojet.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.monprojet.entity.JourFerie;

public interface JourFerieRepository extends JpaRepository<JourFerie, Long> {

    List<JourFerie> findByDateBetweenOrderByDateAsc(LocalDate debut, LocalDate fin);

    boolean existsByDate(LocalDate date);

    List<JourFerie> findAllByOrderByDateDesc();
}
