package com.btrack.modules.workout.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.modules.auth.security.BTrackPrincipal;
import com.btrack.modules.workout.dto.AddExerciseRequest;
import com.btrack.modules.workout.dto.CreateDayRequest;
import com.btrack.modules.workout.dto.CreatePlanRequest;
import com.btrack.modules.workout.dto.WorkoutDayExerciseResponse;
import com.btrack.modules.workout.dto.WorkoutDayResponse;
import com.btrack.modules.workout.dto.WorkoutPlanResponse;
import com.btrack.modules.workout.entity.WorkoutDay;
import com.btrack.modules.workout.entity.WorkoutDayExercise;
import com.btrack.modules.workout.entity.WorkoutPlan;
import com.btrack.modules.workout.service.WorkoutPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workout-plans")
@RequiredArgsConstructor
@Tag(name = "Workout Plans")
public class WorkoutPlanController {

    private final WorkoutPlanService planService;

    @GetMapping
    @Operation(summary = "Get all workout plans")
    public ResponseEntity<ApiResponse<List<WorkoutPlanResponse>>> getPlans(
            @AuthenticationPrincipal BTrackPrincipal principal) {
        List<WorkoutPlanResponse> plans = planService.getPlans(principal.getUserId()).stream()
                .map(WorkoutPlanResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(plans));
    }

    @GetMapping("/{planId}")
    @Operation(summary = "Get a specific workout plan")
    public ResponseEntity<ApiResponse<WorkoutPlanResponse>> getPlan(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID planId) {
        WorkoutPlan plan = planService.getPlan(principal.getUserId(), planId);
        return ResponseEntity.ok(ApiResponse.ok(WorkoutPlanResponse.from(plan)));
    }

    @PostMapping
    @Operation(summary = "Create a workout plan")
    public ResponseEntity<ApiResponse<WorkoutPlanResponse>> createPlan(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @Valid @RequestBody CreatePlanRequest request) {
        WorkoutPlan plan = planService.createPlan(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(WorkoutPlanResponse.from(plan)));
    }

    @DeleteMapping("/{planId}")
    @Operation(summary = "Delete a workout plan")
    public ResponseEntity<ApiResponse<Void>> deletePlan(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID planId) {
        planService.deletePlan(principal.getUserId(), planId);
        return ResponseEntity.ok(ApiResponse.ok("Plan deleted"));
    }

    @PostMapping("/{planId}/days")
    @Operation(summary = "Add a workout day to a plan")
    public ResponseEntity<ApiResponse<WorkoutDayResponse>> addDay(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID planId,
            @Valid @RequestBody CreateDayRequest request) {
        WorkoutDay day = planService.addDay(principal.getUserId(), planId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(WorkoutDayResponse.from(day)));
    }

    @PostMapping("/days/{dayId}/exercises")
    @Operation(summary = "Add an exercise to a workout day")
    public ResponseEntity<ApiResponse<WorkoutDayExerciseResponse>> addExercise(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID dayId,
            @Valid @RequestBody AddExerciseRequest request) {
        WorkoutDayExercise wde = planService.addExercise(principal.getUserId(), dayId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(WorkoutDayExerciseResponse.from(wde)));
    }

    @PatchMapping("/days/{dayId}")
    @Operation(summary = "Rename a workout day")
    public ResponseEntity<ApiResponse<WorkoutDayResponse>> renameDay(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID dayId,
            @RequestBody Map<String, String> body) {
        WorkoutDay day = planService.renameDay(principal.getUserId(), dayId, body.get("name"));
        return ResponseEntity.ok(ApiResponse.ok(WorkoutDayResponse.from(day)));
    }

    @DeleteMapping("/days/{dayId}")
    @Operation(summary = "Delete a workout day")
    public ResponseEntity<ApiResponse<Void>> deleteDay(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID dayId) {
        planService.deleteDay(principal.getUserId(), dayId);
        return ResponseEntity.ok(ApiResponse.ok("Day deleted"));
    }
}
