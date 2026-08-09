package com.btrack.modules.recovery.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.common.response.PagedResponse;
import com.btrack.modules.auth.security.BTrackPrincipal;
import com.btrack.modules.recovery.dto.*;
import com.btrack.modules.recovery.service.RecoveryScoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/recovery")
@RequiredArgsConstructor
@Tag(name = "Recovery Score")
public class RecoveryController {

    private final RecoveryScoreService recoveryService;

    @GetMapping("/today")
    @Operation(summary = "Get or calculate today's recovery score")
    public ResponseEntity<ApiResponse<RecoveryScoreResponse>> getToday(
            @AuthenticationPrincipal BTrackPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(recoveryService.getOrCalculateToday(principal.getUserId())));
    }

    @GetMapping("/{date}")
    @Operation(summary = "Get recovery score for a specific date")
    public ResponseEntity<ApiResponse<RecoveryScoreResponse>> getByDate(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(recoveryService.getByDate(principal.getUserId(), date)));
    }

    @GetMapping("/history")
    @Operation(summary = "Get recovery score history (Premium: unlimited; Free: 7 days)")
    public ResponseEntity<ApiResponse<PagedResponse<RecoveryScoreResponse>>> getHistory(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                recoveryService.getHistory(principal.getUserId(), page, size)));
    }

    @PostMapping("/recalculate")
    @Operation(summary = "Force recalculation of today's recovery score")
    public ResponseEntity<ApiResponse<RecoveryScoreResponse>> recalculate(
            @AuthenticationPrincipal BTrackPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(recoveryService.recalculate(principal.getUserId())));
    }

    @GetMapping("/check-in/today")
    @Operation(summary = "Get today's check-in (null if not yet submitted)")
    public ResponseEntity<ApiResponse<RecoveryCheckInResponse>> getTodayCheckIn(
            @AuthenticationPrincipal BTrackPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(recoveryService.getTodayCheckIn(principal.getUserId())));
    }

    @PostMapping("/check-in")
    @Operation(summary = "Submit daily wellness check-in")
    public ResponseEntity<ApiResponse<RecoveryCheckInResponse>> createCheckIn(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @Valid @RequestBody RecoveryCheckInRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                recoveryService.createCheckIn(principal.getUserId(), request)));
    }

    @PutMapping("/check-in/{id}")
    @Operation(summary = "Update an existing check-in")
    public ResponseEntity<ApiResponse<RecoveryCheckInResponse>> updateCheckIn(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody RecoveryCheckInRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                recoveryService.updateCheckIn(principal.getUserId(), id, request)));
    }

    @GetMapping("/recommendations")
    @Operation(summary = "Get today's recovery recommendations (calculates score if not yet computed)")
    public ResponseEntity<ApiResponse<List<RecoveryRecommendationDto>>> getRecommendations(
            @AuthenticationPrincipal BTrackPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(
                recoveryService.getTodayRecommendations(principal.getUserId())));
    }
}
