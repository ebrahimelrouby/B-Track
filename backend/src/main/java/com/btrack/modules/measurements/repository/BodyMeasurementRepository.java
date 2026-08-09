package com.btrack.modules.measurements.repository;

import com.btrack.modules.measurements.entity.BodyMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BodyMeasurementRepository extends JpaRepository<BodyMeasurement, UUID> {

    Optional<BodyMeasurement> findByUserIdAndDate(UUID userId, LocalDate date);

    @Query("SELECT m FROM BodyMeasurement m WHERE m.user.id = :userId AND m.date >= :from ORDER BY m.date DESC")
    List<BodyMeasurement> findByUserIdSince(@Param("userId") UUID userId, @Param("from") LocalDate from);

    @Query("SELECT m FROM BodyMeasurement m WHERE m.user.id = :userId ORDER BY m.date DESC")
    List<BodyMeasurement> findAllByUserIdOrderByDateDesc(@Param("userId") UUID userId);
}
