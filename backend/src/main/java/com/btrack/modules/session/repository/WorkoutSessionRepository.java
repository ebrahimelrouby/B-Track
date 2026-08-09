package com.btrack.modules.session.repository;

import com.btrack.modules.session.entity.WorkoutSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, UUID> {

    @Query("SELECT ws FROM WorkoutSession ws WHERE ws.user.id = :userId AND ws.status = 'IN_PROGRESS'")
    Optional<WorkoutSession> findActiveSession(UUID userId);

    @Query("SELECT ws FROM WorkoutSession ws WHERE ws.user.id = :userId AND ws.status = 'COMPLETED' ORDER BY ws.completedAt DESC")
    Page<WorkoutSession> findCompletedSessions(UUID userId, Pageable pageable);

    @Query("SELECT ws FROM WorkoutSession ws WHERE ws.user.id = :userId AND ws.completedAt >= :since AND ws.status = 'COMPLETED'")
    List<WorkoutSession> findSessionsSince(UUID userId, Instant since);

    @Query("SELECT COUNT(ws) FROM WorkoutSession ws WHERE ws.user.id = :userId AND ws.status = 'COMPLETED'")
    long countCompletedSessions(UUID userId);

    Optional<WorkoutSession> findByLocalSessionId(String localSessionId);

    @Query("""
        SELECT ws FROM WorkoutSet ws
        JOIN ws.sessionExercise se
        JOIN se.session s
        WHERE s.user.id = :userId
          AND se.exercise.id = :exerciseId
          AND s.status = 'COMPLETED'
          AND ws.completed = true
        ORDER BY s.completedAt DESC
        LIMIT 10
        """)
    List<com.btrack.modules.session.entity.WorkoutSet> findLastSetsForExercise(
            @org.springframework.data.repository.query.Param("userId") UUID userId,
            @org.springframework.data.repository.query.Param("exerciseId") UUID exerciseId);
}
