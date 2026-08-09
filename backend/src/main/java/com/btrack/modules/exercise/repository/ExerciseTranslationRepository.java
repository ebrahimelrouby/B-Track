package com.btrack.modules.exercise.repository;

import com.btrack.modules.exercise.entity.ExerciseTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExerciseTranslationRepository extends JpaRepository<ExerciseTranslation, UUID> {

    List<ExerciseTranslation> findByExerciseId(UUID exerciseId);

    Optional<ExerciseTranslation> findByExerciseIdAndLocale(UUID exerciseId, String locale);
}
