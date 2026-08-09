package com.btrack.modules.sleep.repository;

import com.btrack.modules.sleep.entity.SleepLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SleepLogRepository extends JpaRepository<SleepLog, UUID> {

    Optional<SleepLog> findByUserIdAndDate(UUID userId, LocalDate date);

    @Query("SELECT s FROM SleepLog s WHERE s.user.id = :userId AND s.date >= :from ORDER BY s.date DESC")
    List<SleepLog> findByUserIdSince(@Param("userId") UUID userId, @Param("from") LocalDate from);

    @Query("SELECT AVG(s.durationMinutes) FROM SleepLog s WHERE s.user.id = :userId AND s.date >= :from")
    Double avgDurationSince(@Param("userId") UUID userId, @Param("from") LocalDate from);
}
