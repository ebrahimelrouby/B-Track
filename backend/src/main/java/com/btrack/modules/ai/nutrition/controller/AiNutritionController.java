package com.btrack.modules.ai.nutrition.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.modules.ai.nutrition.dto.AiNutritionEstimateResponse;
import com.btrack.modules.ai.nutrition.dto.AiNutritionSaveRequest;
import com.btrack.modules.ai.nutrition.dto.AiNutritionTextRequest;
import com.btrack.modules.ai.nutrition.service.AiNutritionService;
import com.btrack.modules.auth.security.BTrackPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/nutrition")
@RequiredArgsConstructor
@Tag(name = "AI Nutrition")
public class AiNutritionController {

    private final AiNutritionService nutritionService;

    @PostMapping("/text")
    @Operation(summary = "Estimate macros from text description")
    public ResponseEntity<ApiResponse<AiNutritionEstimateResponse>> estimateFromText(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @Valid @RequestBody AiNutritionTextRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                nutritionService.estimateFromText(principal.getUserId(), request)));
    }

    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Estimate macros from food photo")
    public ResponseEntity<ApiResponse<AiNutritionEstimateResponse>> estimateFromPhoto(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @RequestPart("photo") MultipartFile photo) {
        return ResponseEntity.ok(ApiResponse.ok(
                nutritionService.estimateFromPhoto(principal.getUserId(), photo)));
    }

    @PutMapping("/{estimateId}/save")
    @Operation(summary = "Confirm and save an estimate to nutrition log")
    public ResponseEntity<ApiResponse<AiNutritionEstimateResponse>> saveEstimate(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID estimateId,
            @Valid @RequestBody AiNutritionSaveRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                nutritionService.saveEstimate(principal.getUserId(), estimateId, request)));
    }

    @GetMapping("/history")
    @Operation(summary = "Get saved AI nutrition estimates")
    public ResponseEntity<ApiResponse<Page<AiNutritionEstimateResponse>>> getHistory(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                nutritionService.getHistory(principal.getUserId(), page, size)));
    }

    @DeleteMapping("/{estimateId}")
    @Operation(summary = "Delete an AI nutrition estimate")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID estimateId) {
        nutritionService.delete(principal.getUserId(), estimateId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
