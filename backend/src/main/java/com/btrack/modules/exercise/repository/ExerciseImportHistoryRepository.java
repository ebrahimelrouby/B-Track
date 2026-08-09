package com.btrack.modules.exercise.repository;

import com.btrack.modules.exercise.entity.ExerciseImportHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ExerciseImportHistoryRepository extends JpaRepository<ExerciseImportHistory, UUID> {

    Page<ExerciseImportHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
