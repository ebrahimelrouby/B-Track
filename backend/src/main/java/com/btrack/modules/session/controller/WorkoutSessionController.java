package com.btrack.modules.session.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.common.response.PagedResponse;
import com.btrack.modules.auth.security.BTrackPrincipal;
import com.btrack.modules.session.dto.StartSessionRequest;
import com.btrack.modules.session.dto.SyncSessionRequest;
import com.btrack.modules.session.dto.WorkoutSessionResponse;
import com.btrack.modules.session.dto.WorkoutSetResponse;
import com.btrack.modules.session.service.WorkoutSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
@Tag(name = "Workout Sessions")
public class WorkoutSessionController {

    private final WorkoutSessionService sessionService;

    @PostMapping("/start")
    @Operation(summary = "Start a new workout session")
    public ResponseEntity<ApiResponse<WorkoutSessionResponse>> startSession(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @RequestBody StartSessionRequest request) {
        var session = sessionService.startSession(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(WorkoutSessionResponse.from(session)));
    }

    @PostMapping("/{sessionId}/finish")
    @Operation(summary = "Finish a workout session")
    public ResponseEntity<ApiResponse<WorkoutSessionResponse>> finishSession(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID sessionId,
            @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.get("notes") : null;
        var session = sessionService.finishSession(principal.getUserId(), sessionId, notes);
        return ResponseEntity.ok(ApiResponse.ok(WorkoutSessionResponse.from(session)));
    }

    @PostMapping("/sync")
    @Operation(summary = "Sync an offline workout session")
    public ResponseEntity<ApiResponse<WorkoutSessionResponse>> syncSession(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @RequestBody SyncSessionRequest request) {
        var session = sessionService.syncSession(principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok(WorkoutSessionResponse.from(session)));
    }

    @GetMapping("/history")
    @Operation(summary = "Get workout history (paginated)")
    public ResponseEntity<ApiResponse<PagedResponse<WorkoutSessionResponse>>> getHistory(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var sessions = sessionService.getHistory(principal.getUserId(), PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.from(sessions.map(WorkoutSessionResponse::from))));
    }

    @GetMapping("/{sessionId}")
    @Operation(summary = "Get a specific session")
    public ResponseEntity<ApiResponse<WorkoutSessionResponse>> getSession(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID sessionId) {
        var session = sessionService.getSession(principal.getUserId(), sessionId);
        return ResponseEntity.ok(ApiResponse.ok(WorkoutSessionResponse.from(session)));
    }

    @GetMapping("/exercises/{exerciseId}/last-sets")
    @Operation(summary = "Get last completed sets for an exercise (for pre-fill)")
    public ResponseEntity<ApiResponse<List<WorkoutSetResponse>>> getLastSets(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID exerciseId) {
        var sets = sessionService.getLastSets(principal.getUserId(), exerciseId).stream()
                .map(WorkoutSetResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(sets));
    }
}
