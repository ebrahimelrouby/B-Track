package com.btrack.modules.exercise.repository;

import com.btrack.modules.exercise.entity.Exercise;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, UUID> {

    // Mobile API: PUBLISHED system exercises + user's own custom exercises
    @Query("""
        SELECT e FROM Exercise e
        WHERE e.active = true
        AND (
            (e.custom = false AND e.status = 'PUBLISHED')
            OR (e.custom = true AND (:userId IS NULL OR e.createdBy.id = :userId))
        )
        AND (:search IS NULL OR LOWER(e.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        AND (:muscleGroup IS NULL OR CAST(e.muscleGroup AS string) = :muscleGroup)
        AND (:equipment IS NULL OR CAST(e.equipment AS string) = :equipment)
        """)
    Page<Exercise> searchExercises(
            @Param("userId") UUID userId,
            @Param("search") String search,
            @Param("muscleGroup") String muscleGroup,
            @Param("equipment") String equipment,
            Pageable pageable
    );

    // Admin API: all exercises with optional status filter
    @Query("""
        SELECT e FROM Exercise e
        WHERE e.active = true
        AND (:search IS NULL OR LOWER(e.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        AND (:muscleGroup IS NULL OR CAST(e.muscleGroup AS string) = :muscleGroup)
        AND (:equipment IS NULL OR CAST(e.equipment AS string) = :equipment)
        AND (:status IS NULL OR CAST(e.status AS string) = :status)
        AND (:provider IS NULL OR e.sourceProvider = :provider)
        """)
    Page<Exercise> adminSearchExercises(
            @Param("search") String search,
            @Param("muscleGroup") String muscleGroup,
            @Param("equipment") String equipment,
            @Param("status") String status,
            @Param("provider") String provider,
            Pageable pageable
    );

    @Query("SELECT COUNT(e) FROM Exercise e WHERE e.createdBy.id = :userId AND e.custom = true AND e.active = true")
    int countCustomExercises(@Param("userId") UUID userId);

    Optional<Exercise> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsByExternalIdAndSourceProvider(String externalId, String sourceProvider);

    @Query("""
        SELECT e FROM Exercise e
        WHERE e.active = true
        AND e.id != :excludeId
        AND (LOWER(e.name) = LOWER(:name) OR e.slug = :slug)
        """)
    List<Exercise> findPotentialDuplicates(
            @Param("excludeId") UUID excludeId,
            @Param("name") String name,
            @Param("slug") String slug
    );
}
