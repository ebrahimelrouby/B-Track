package com.btrack.modules.water.repository;

import com.btrack.modules.water.entity.WaterLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WaterLogRepository extends JpaRepository<WaterLog, UUID> {

    @Query("SELECT COALESCE(SUM(w.amountMl), 0) FROM WaterLog w WHERE w.user.id = :userId AND w.loggedAt >= :start AND w.loggedAt < :end")
    Optional<Long> sumAmountMlBetween(
            @Param("userId") UUID userId,
            @Param("start") Instant start,
            @Param("end") Instant end);
}
