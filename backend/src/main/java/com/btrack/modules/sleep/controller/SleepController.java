package com.btrack.modules.sleep.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.modules.auth.security.BTrackPrincipal;
import com.btrack.modules.sleep.dto.DailySleepResponse;
import com.btrack.modules.sleep.dto.SleepLogRequest;
import com.btrack.modules.sleep.dto.SleepLogResponse;
import com.btrack.modules.sleep.service.SleepService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/health/sleep")
@RequiredArgsConstructor
@Tag(name = "Health - Sleep")
public class SleepController {

    private final SleepService sleepService;

    @GetMapping("/today")
    @Operation(summary = "Get today's sleep data")
    public ResponseEntity<ApiResponse<DailySleepResponse>> getToday(
            @AuthenticationPrincipal BTrackPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(sleepService.getToday(principal.getUserId())));
    }

    @GetMapping("/history")
    @Operation(summary = "Get sleep history")
    public ResponseEntity<ApiResponse<List<DailySleepResponse>>> getHistory(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @RequestParam(defaultValue = "14") int days) {
        return ResponseEntity.ok(ApiResponse.ok(sleepService.getHistory(principal.getUserId(), days)));
    }

    @PostMapping
    @Operation(summary = "Log a sleep entry")
    public ResponseEntity<ApiResponse<SleepLogResponse>> logSleep(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @Valid @RequestBody SleepLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(sleepService.logSleep(principal.getUserId(), request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a sleep log entry")
    public ResponseEntity<ApiResponse<Void>> deleteSleepLog(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID id) {
        sleepService.deleteSleepLog(principal.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Deleted"));
    }
}
