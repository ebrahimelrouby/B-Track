package com.btrack.modules.exercise.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.common.response.PagedResponse;
import com.btrack.modules.auth.security.BTrackPrincipal;
import com.btrack.modules.exercise.dto.CreateExerciseRequest;
import com.btrack.modules.exercise.dto.ExerciseResponse;
import com.btrack.modules.exercise.entity.Exercise;
import com.btrack.modules.exercise.repository.ExerciseRepository;
import com.btrack.modules.subscription.entity.Subscription;
import com.btrack.modules.subscription.service.SubscriptionService;
import com.btrack.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/exercises")
@RequiredArgsConstructor
@Tag(name = "Exercises")
public class ExerciseController {

    private final ExerciseRepository exerciseRepository;
    private final SubscriptionService subscriptionService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Search exercises")
    public ResponseEntity<ApiResponse<PagedResponse<ExerciseResponse>>> search(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String muscleGroup,
            @RequestParam(required = false) String equipment,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {

        UUID userId = principal != null ? principal.getUserId() : null;
        Exercise.MuscleGroup mg = muscleGroup != null ? Exercise.MuscleGroup.valueOf(muscleGroup) : null;
        Exercise.EquipmentType eq = equipment != null ? Exercise.EquipmentType.valueOf(equipment) : null;

        var result = exerciseRepository.searchExercises(
                userId, search, mg, eq,
                PageRequest.of(page, size, Sort.by("name")));

        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.from(result.map(ExerciseResponse::from))));
    }

    @PostMapping
    @Operation(summary = "Create a custom exercise")
    public ResponseEntity<ApiResponse<ExerciseResponse>> createCustom(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @Valid @RequestBody CreateExerciseRequest request) {

        int current = exerciseRepository.countCustomExercises(principal.getUserId());
        subscriptionService.requireWithinLimit(principal.getUserId(), "custom_exercises", current);

        Exercise exercise = Exercise.builder()
                .name(request.name())
                .muscleGroup(Exercise.MuscleGroup.valueOf(request.muscleGroup()))
                .equipment(Exercise.EquipmentType.valueOf(request.equipment()))
                .difficulty(Exercise.Difficulty.valueOf(request.difficulty()))
                .instructions(request.instructions())
                .tips(request.tips())
                .imageUrl(request.imageUrl())
                .gifUrl(request.gifUrl())
                .custom(true)
                .createdBy(userRepository.getReferenceById(principal.getUserId()))
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ExerciseResponse.from(exerciseRepository.save(exercise))));
    }
}
