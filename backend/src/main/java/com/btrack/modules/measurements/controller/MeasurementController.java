package com.btrack.modules.measurements.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.modules.auth.security.BTrackPrincipal;
import com.btrack.modules.measurements.dto.BodyMeasurementRequest;
import com.btrack.modules.measurements.dto.BodyMeasurementResponse;
import com.btrack.modules.measurements.service.MeasurementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/measurements")
@RequiredArgsConstructor
@Tag(name = "Body Measurements")
public class MeasurementController {

    private final MeasurementService measurementService;

    @PostMapping("/weight")
    @Operation(summary = "Log or update body measurements for a date")
    public ResponseEntity<ApiResponse<BodyMeasurementResponse>> save(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @Valid @RequestBody BodyMeasurementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(measurementService.save(principal.getUserId(), request)));
    }

    @GetMapping("/weight/history")
    @Operation(summary = "Get weight history (default last 90 days)")
    public ResponseEntity<ApiResponse<List<BodyMeasurementResponse>>> getHistory(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @RequestParam(defaultValue = "90") int days) {
        return ResponseEntity.ok(ApiResponse.ok(measurementService.getHistory(principal.getUserId(), days)));
    }

    @GetMapping("/weight")
    @Operation(summary = "Get all measurement entries")
    public ResponseEntity<ApiResponse<List<BodyMeasurementResponse>>> getAll(
            @AuthenticationPrincipal BTrackPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(measurementService.getAll(principal.getUserId())));
    }
}
