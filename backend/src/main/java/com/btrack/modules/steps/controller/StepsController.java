package com.btrack.modules.steps.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.modules.auth.security.BTrackPrincipal;
import com.btrack.modules.steps.dto.DailyStepsResponse;
import com.btrack.modules.steps.dto.StepsLogRequest;
import com.btrack.modules.steps.service.StepsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/health/steps")
@RequiredArgsConstructor
@Tag(name = "Health - Steps")
public class StepsController {

    private final StepsService stepsService;

    @GetMapping("/today")
    @Operation(summary = "Get today's step count")
    public ResponseEntity<ApiResponse<DailyStepsResponse>> getToday(
            @AuthenticationPrincipal BTrackPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(stepsService.getToday(principal.getUserId())));
    }

    @GetMapping("/history")
    @Operation(summary = "Get step history")
    public ResponseEntity<ApiResponse<List<DailyStepsResponse>>> getHistory(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @RequestParam(defaultValue = "14") int days) {
        return ResponseEntity.ok(ApiResponse.ok(stepsService.getHistory(principal.getUserId(), days)));
    }

    @PostMapping
    @Operation(summary = "Log steps for a date")
    public ResponseEntity<ApiResponse<DailyStepsResponse>> logSteps(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @Valid @RequestBody StepsLogRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(stepsService.logSteps(principal.getUserId(), request)));
    }
}
