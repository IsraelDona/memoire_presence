package com.monprojet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.monprojet.entity.GpsConfig;

public interface GpsConfigRepository extends JpaRepository<GpsConfig, Long> {
}
