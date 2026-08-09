package com.btrack.modules.exercise.repository;

import com.btrack.modules.exercise.entity.ExerciseAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExerciseAuditLogRepository extends JpaRepository<ExerciseAuditLog, UUID> {

    Page<ExerciseAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<ExerciseAuditLog> findByEntityIdOrderByCreatedAtDesc(UUID entityId, Pageable pageable);

    List<ExerciseAuditLog> findByCreatedAtAfter(Instant since);
}
