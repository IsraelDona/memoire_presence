package com.monprojet.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.monprojet.entity.RapportMensuel;

public interface RapportMensuelRepository
        extends JpaRepository<RapportMensuel, Long> {

}