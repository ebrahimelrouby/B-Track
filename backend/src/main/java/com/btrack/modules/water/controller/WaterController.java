package com.btrack.modules.water.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.modules.auth.security.BTrackPrincipal;
import com.btrack.modules.water.dto.WaterLogRequest;
import com.btrack.modules.water.service.WaterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/water")
@RequiredArgsConstructor
@Tag(name = "Water / Hydration")
public class WaterController {

    private final WaterService waterService;

    @GetMapping("/{date}")
    @Operation(summary = "Get total water intake for a date (ml)")
    public ResponseEntity<ApiResponse<Long>> getTotal(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(waterService.getTotalForDate(principal.getUserId(), date)));
    }

    @PostMapping("/{date}")
    @Operation(summary = "Log water intake for a date")
    public ResponseEntity<ApiResponse<Void>> logWater(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody WaterLogRequest request) {
        waterService.logWater(principal.getUserId(), date, request);
        return ResponseEntity.ok(ApiResponse.ok("Logged"));
    }
}
