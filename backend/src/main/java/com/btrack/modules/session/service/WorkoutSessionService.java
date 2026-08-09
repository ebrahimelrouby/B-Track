package com.btrack.modules.session.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.modules.exercise.entity.Exercise;
import com.btrack.modules.exercise.repository.ExerciseRepository;
import com.btrack.modules.session.dto.StartSessionRequest;
import com.btrack.modules.session.dto.SyncSessionRequest;
import com.btrack.modules.session.entity.SessionExercise;
import com.btrack.modules.session.entity.WorkoutSession;
import com.btrack.modules.session.entity.WorkoutSet;
import com.btrack.modules.session.repository.WorkoutSessionRepository;
import com.btrack.modules.user.entity.User;
import com.btrack.modules.user.repository.UserRepository;
import com.btrack.modules.workout.entity.WorkoutDay;
import com.btrack.modules.workout.entity.WorkoutPlan;
import com.btrack.modules.workout.repository.WorkoutPlanRepository;
import com.btrack.modules.workout.repository.WorkoutDayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkoutSessionService {

    private final WorkoutSessionRepository sessionRepository;
    private final WorkoutPlanRepository planRepository;
    private final WorkoutDayRepository dayRepository;
    private final ExerciseRepository exerciseRepository;
    private final UserRepository userRepository;

    @Transactional
    public WorkoutSession startSession(UUID userId, StartSessionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BTrackException.notFound("User not found", ErrorCode.USER_NOT_FOUND));

        // If there's already an active session, abandon it
        sessionRepository.findActiveSession(userId)
                .ifPresent(existing -> {
                    existing.setStatus(WorkoutSession.SessionStatus.ABANDONED);
                    sessionRepository.save(existing);
                });

        WorkoutPlan plan = null;
        WorkoutDay day = null;

        if (request.planId() != null) {
            plan = planRepository.findByIdAndUserId(request.planId(), userId)
                    .orElseThrow(() -> BTrackException.notFound("Workout plan not found", ErrorCode.WORKOUT_PLAN_NOT_FOUND));
        }
        if (request.dayId() != null) {
            day = dayRepository.findById(request.dayId())
                    .orElseThrow(() -> BTrackException.notFound("Workout day not found", ErrorCode.WORKOUT_DAY_NOT_FOUND));
        }

        WorkoutSession session = WorkoutSession.builder()
                .user(user)
                .plan(plan)
                .day(day)
                .name(request.name() != null ? request.name() : (day != null ? day.getName() : "Quick Workout"))
                .localSessionId(request.localSessionId())
                .build();

        return sessionRepository.save(session);
    }

    @Transactional
    public WorkoutSession finishSession(UUID userId, UUID sessionId, String notes) {
        WorkoutSession session = getOwnedSession(userId, sessionId);

        if (session.getStatus() == WorkoutSession.SessionStatus.COMPLETED) {
            throw BTrackException.badRequest("Session already completed", ErrorCode.SESSION_ALREADY_COMPLETED);
        }

        Instant now = Instant.now();
        long durationSeconds = now.getEpochSecond() - session.getStartedAt().getEpochSecond();

        // Calculate total volume
        BigDecimal totalVolume = session.getExercises().stream()
                .flatMap(ex -> ex.getSets().stream())
                .filter(WorkoutSet::isCompleted)
                .filter(s -> s.getWeightKg() != null && s.getReps() != null)
                .map(s -> s.getWeightKg().multiply(BigDecimal.valueOf(s.getReps())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        session.setStatus(WorkoutSession.SessionStatus.COMPLETED);
        session.setCompletedAt(now);
        session.setDurationSeconds((int) durationSeconds);
        session.setTotalVolumeKg(totalVolume);
        session.setNotes(notes);

        return sessionRepository.save(session);
    }

    @Transactional
    public WorkoutSession syncSession(UUID userId, SyncSessionRequest request) {
        // Check if already synced (idempotent for offline sync)
        if (request.localSessionId() != null) {
            var existing = sessionRepository.findByLocalSessionId(request.localSessionId());
            if (existing.isPresent()) return existing.get();
        }

        User user = userRepository.getReferenceById(userId);

        WorkoutSession session = WorkoutSession.builder()
                .user(user)
                .name(request.name())
                .localSessionId(request.localSessionId())
                .startedAt(request.startedAt() != null ? request.startedAt() : Instant.now())
                .completedAt(request.completedAt())
                .durationSeconds(request.durationSeconds())
                .status(WorkoutSession.SessionStatus.COMPLETED)
                .notes(request.notes())
                .synced(true)
                .build();

        if (request.planId() != null) {
            session.setPlan(planRepository.getReferenceById(request.planId()));
        }
        if (request.dayId() != null) {
            session.setDay(dayRepository.getReferenceById(request.dayId()));
        }

        // Build exercises and sets
        if (request.exercises() != null) {
            int exOrder = 0;
            for (SyncSessionRequest.SyncExercise reqEx : request.exercises()) {
                Exercise exercise = exerciseRepository.findById(reqEx.exerciseId())
                        .orElseThrow(() -> BTrackException.notFound("Exercise not found", ErrorCode.EXERCISE_NOT_FOUND));

                SessionExercise sessionExercise = SessionExercise.builder()
                        .session(session)
                        .exercise(exercise)
                        .sortOrder(exOrder++)
                        .notes(reqEx.notes())
                        .build();

                if (reqEx.sets() != null) {
                    for (SyncSessionRequest.SyncSet reqSet : reqEx.sets()) {
                        WorkoutSet set = WorkoutSet.builder()
                                .sessionExercise(sessionExercise)
                                .setNumber(reqSet.setNumber())
                                .setType(parseSetType(reqSet.setType()))
                                .weightKg(reqSet.weightKg())
                                .reps(reqSet.reps())
                                .rpe(reqSet.rpe())
                                .restSeconds(reqSet.restSeconds())
                                .notes(reqSet.notes())
                                .completed(reqSet.completed())
                                .completedAt(reqSet.completedAt())
                                .build();
                        sessionExercise.getSets().add(set);
                    }
                }
                session.getExercises().add(sessionExercise);
            }
        }

        // Recalculate volume
        BigDecimal volume = session.getExercises().stream()
                .flatMap(ex -> ex.getSets().stream())
                .filter(WorkoutSet::isCompleted)
                .filter(s -> s.getWeightKg() != null && s.getReps() != null)
                .map(s -> s.getWeightKg().multiply(BigDecimal.valueOf(s.getReps())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        session.setTotalVolumeKg(volume);

        return sessionRepository.save(session);
    }

    public Page<WorkoutSession> getHistory(UUID userId, Pageable pageable) {
        return sessionRepository.findCompletedSessions(userId, pageable);
    }

    public WorkoutSession getSession(UUID userId, UUID sessionId) {
        return getOwnedSession(userId, sessionId);
    }

    public List<WorkoutSet> getLastSets(UUID userId, UUID exerciseId) {
        return sessionRepository.findLastSetsForExercise(userId, exerciseId);
    }

    private WorkoutSession getOwnedSession(UUID userId, UUID sessionId) {
        WorkoutSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> BTrackException.notFound("Session not found", ErrorCode.SESSION_NOT_FOUND));
        if (!session.getUser().getId().equals(userId)) {
            throw BTrackException.forbidden("Access denied");
        }
        return session;
    }

    private WorkoutSet.SetType parseSetType(String type) {
        if (type == null) return WorkoutSet.SetType.NORMAL;
        return switch (type.toUpperCase()) {
            case "WARMUP" -> WorkoutSet.SetType.WARMUP;
            case "DROP_SET" -> WorkoutSet.SetType.DROP_SET;
            case "FAILURE" -> WorkoutSet.SetType.FAILURE;
            default -> WorkoutSet.SetType.NORMAL;
        };
    }
}
