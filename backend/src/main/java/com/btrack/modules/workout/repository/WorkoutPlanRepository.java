package com.btrack.modules.workout.repository;

import com.btrack.modules.workout.entity.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, UUID> {
    List<WorkoutPlan> findByUserIdAndActiveTrue(UUID userId);
    Optional<WorkoutPlan> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT COUNT(wp) FROM WorkoutPlan wp WHERE wp.user.id = :userId AND wp.active = true")
    int countActivePlans(UUID userId);
}
