package com.btrack.modules.recovery.repository;

import com.btrack.modules.recovery.entity.RecoveryCheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecoveryCheckInRepository extends JpaRepository<RecoveryCheckIn, UUID> {

    Optional<RecoveryCheckIn> findByUserIdAndCheckInDate(UUID userId, LocalDate date);

    boolean existsByUserIdAndCheckInDate(UUID userId, LocalDate date);
}
