package com.monprojet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.monprojet.entity.LieuBenin;
import java.util.Optional;

@Repository
public interface LieuBeninRepository extends JpaRepository<LieuBenin, Long> {

    @Query(value = """
            SELECT * FROM lieux_benin
            ORDER BY (
                6371 * acos(
                    cos(radians(:latitude)) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians(:longitude)) +
                    sin(radians(:latitude)) * sin(radians(latitude))
                )
            )
            LIMIT 1
            """, nativeQuery = true)
    LieuBenin findNearest(@Param("latitude") Double latitude, @Param("longitude") Double longitude);

    Optional<LieuBenin> findByNomIgnoreCase(String nom);
}
