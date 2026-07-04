package com.monprojet.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.monprojet.entity.Service;

public interface ServiceRepository extends JpaRepository<Service, Long> {

    Optional<Service> findByNom(String nom);
}