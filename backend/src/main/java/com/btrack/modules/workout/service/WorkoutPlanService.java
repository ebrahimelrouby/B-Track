package com.btrack.modules.workout.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.modules.exercise.entity.Exercise;
import com.btrack.modules.exercise.repository.ExerciseRepository;
import com.btrack.modules.subscription.entity.Subscription;
import com.btrack.modules.subscription.service.SubscriptionService;
import com.btrack.modules.user.repository.UserRepository;
import com.btrack.modules.workout.dto.CreatePlanRequest;
import com.btrack.modules.workout.dto.CreateDayRequest;
import com.btrack.modules.workout.dto.AddExerciseRequest;
import com.btrack.modules.workout.entity.WorkoutDay;
import com.btrack.modules.workout.entity.WorkoutDayExercise;
import com.btrack.modules.workout.entity.WorkoutPlan;
import com.btrack.modules.workout.repository.WorkoutDayRepository;
import com.btrack.modules.workout.repository.WorkoutPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkoutPlanService {

    private final WorkoutPlanRepository planRepository;
    private final WorkoutDayRepository dayRepository;
    private final ExerciseRepository exerciseRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;

    public List<WorkoutPlan> getPlans(UUID userId) {
        return planRepository.findByUserIdAndActiveTrue(userId);
    }

    @Transactional
    public WorkoutPlan createPlan(UUID userId, CreatePlanRequest request) {
        int currentCount = planRepository.countActivePlans(userId);
        subscriptionService.requireWithinLimit(userId, "workout_plans", currentCount);

        WorkoutPlan plan = WorkoutPlan.builder()
                .user(userRepository.getReferenceById(userId))
                .name(request.name())
                .description(request.description())
                .build();
        return planRepository.save(plan);
    }

    @Transactional
    public WorkoutDay addDay(UUID userId, UUID planId, CreateDayRequest request) {
        WorkoutPlan plan = planRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> BTrackException.notFound("Plan not found", ErrorCode.WORKOUT_PLAN_NOT_FOUND));

        int nextOrder = plan.getDays().size();
        WorkoutDay day = WorkoutDay.builder()
                .plan(plan)
                .name(request.name())
                .sortOrder(nextOrder)
                .notes(request.notes())
                .build();
        return dayRepository.save(day);
    }

    @Transactional
    public WorkoutDayExercise addExercise(UUID userId, UUID dayId, AddExerciseRequest request) {
        WorkoutDay day = dayRepository.findById(dayId)
                .orElseThrow(() -> BTrackException.notFound("Workout day not found", ErrorCode.WORKOUT_DAY_NOT_FOUND));

        if (!day.getPlan().getUser().getId().equals(userId)) {
            throw BTrackException.forbidden("Access denied");
        }

        Exercise exercise = exerciseRepository.findById(request.exerciseId())
                .orElseThrow(() -> BTrackException.notFound("Exercise not found", ErrorCode.EXERCISE_NOT_FOUND));

        int nextOrder = day.getExercises().size();
        WorkoutDayExercise wde = WorkoutDayExercise.builder()
                .day(day)
                .exercise(exercise)
                .sortOrder(nextOrder)
                .targetSets(request.targetSets())
                .targetRepsMin(request.targetRepsMin())
                .targetRepsMax(request.targetRepsMax())
                .targetWeightKg(request.targetWeightKg() != null ? BigDecimal.valueOf(request.targetWeightKg()) : null)
                .restSeconds(request.restSeconds() != null ? request.restSeconds() : 90)
                .notes(request.notes())
                .build();

        day.getExercises().add(wde);
        dayRepository.save(day);
        return wde;
    }

    @Transactional
    public void deletePlan(UUID userId, UUID planId) {
        WorkoutPlan plan = planRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> BTrackException.notFound("Plan not found", ErrorCode.WORKOUT_PLAN_NOT_FOUND));
        plan.setActive(false);
        planRepository.save(plan);
    }

    public WorkoutPlan getPlan(UUID userId, UUID planId) {
        return planRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> BTrackException.notFound("Plan not found", ErrorCode.WORKOUT_PLAN_NOT_FOUND));
    }

    @Transactional
    public WorkoutDay renameDay(UUID userId, UUID dayId, String name) {
        WorkoutDay day = dayRepository.findById(dayId)
                .orElseThrow(() -> BTrackException.notFound("Workout day not found", ErrorCode.WORKOUT_DAY_NOT_FOUND));
        if (!day.getPlan().getUser().getId().equals(userId)) {
            throw BTrackException.forbidden("Access denied");
        }
        day.setName(name);
        return dayRepository.save(day);
    }

    @Transactional
    public void deleteDay(UUID userId, UUID dayId) {
        WorkoutDay day = dayRepository.findById(dayId)
                .orElseThrow(() -> BTrackException.notFound("Workout day not found", ErrorCode.WORKOUT_DAY_NOT_FOUND));
        if (!day.getPlan().getUser().getId().equals(userId)) {
            throw BTrackException.forbidden("Access denied");
        }
        dayRepository.delete(day);
    }
}
