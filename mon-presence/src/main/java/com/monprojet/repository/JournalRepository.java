package com.monprojet.repository;

import com.monprojet.entity.Journal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JournalRepository extends JpaRepository<Journal, Long> {

    List<Journal> findAllByOrderByDateActionDesc();

}