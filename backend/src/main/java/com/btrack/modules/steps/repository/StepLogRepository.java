package com.btrack.modules.steps.repository;

import com.btrack.modules.steps.entity.StepLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StepLogRepository extends JpaRepository<StepLog, UUID> {

    Optional<StepLog> findByUserIdAndDate(UUID userId, LocalDate date);

    @Query("SELECT s FROM StepLog s WHERE s.user.id = :userId AND s.date >= :from ORDER BY s.date DESC")
    List<StepLog> findByUserIdSince(@Param("userId") UUID userId, @Param("from") LocalDate from);
}
