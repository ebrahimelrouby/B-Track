package com.btrack.modules.recovery.repository;

import com.btrack.modules.recovery.entity.RecoveryScore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecoveryScoreRepository extends JpaRepository<RecoveryScore, UUID> {

    Optional<RecoveryScore> findByUserIdAndScoreDate(UUID userId, LocalDate scoreDate);

    Page<RecoveryScore> findByUserIdOrderByScoreDateDesc(UUID userId, Pageable pageable);

    @Query("SELECT r FROM RecoveryScore r WHERE r.user.id = :userId AND r.scoreDate >= :from ORDER BY r.scoreDate DESC")
    List<RecoveryScore> findByUserIdSince(@Param("userId") UUID userId, @Param("from") LocalDate from);

    @Query("SELECT AVG(r.finalScore) FROM RecoveryScore r WHERE r.user.id = :userId AND r.scoreDate >= :from")
    Double avgScoreSince(@Param("userId") UUID userId, @Param("from") LocalDate from);
}
