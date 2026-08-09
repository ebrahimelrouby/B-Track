package com.btrack.modules.workout.repository;

import com.btrack.modules.workout.entity.WorkoutDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WorkoutDayRepository extends JpaRepository<WorkoutDay, UUID> {
}
