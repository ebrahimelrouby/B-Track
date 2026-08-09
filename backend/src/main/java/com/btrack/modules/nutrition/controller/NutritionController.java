package com.btrack.modules.nutrition.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.modules.auth.security.BTrackPrincipal;
import com.btrack.modules.nutrition.dto.*;
import com.btrack.modules.nutrition.service.NutritionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/nutrition")
@RequiredArgsConstructor
@Tag(name = "Nutrition")
public class NutritionController {

    private final NutritionService nutritionService;

    @GetMapping("/foods/search")
    @Operation(summary = "Search food items by name")
    public ResponseEntity<ApiResponse<List<FoodItemResponse>>> searchFoods(
            @RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.ok(nutritionService.searchFoods(q)));
    }

    @GetMapping("/foods/{id}")
    @Operation(summary = "Get a food item by ID")
    public ResponseEntity<ApiResponse<FoodItemResponse>> getFoodById(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(nutritionService.getFoodById(id)));
    }

    @GetMapping("/diary/{date}")
    @Operation(summary = "Get food diary for a specific date")
    public ResponseEntity<ApiResponse<List<MealEntryResponse>>> getDiaryForDate(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(nutritionService.getDiaryForDate(principal.getUserId(), date)));
    }

    @PostMapping("/diary")
    @Operation(summary = "Log a food entry to the diary")
    public ResponseEntity<ApiResponse<MealEntryResponse>> logFood(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @Valid @RequestBody AddMealItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(nutritionService.logFood(principal.getUserId(), request)));
    }

    @DeleteMapping("/diary/{date}/{entryId}")
    @Operation(summary = "Remove a food diary entry")
    public ResponseEntity<ApiResponse<Void>> removeEntry(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @PathVariable UUID entryId) {
        nutritionService.removeEntry(principal.getUserId(), date, entryId);
        return ResponseEntity.ok(ApiResponse.ok("Removed"));
    }

    @GetMapping("/diary/weekly")
    @Operation(summary = "Get last 7 days calorie summary")
    public ResponseEntity<ApiResponse<List<DailyCalorieResponse>>> getWeeklySummary(
            @AuthenticationPrincipal BTrackPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(nutritionService.getWeeklySummary(principal.getUserId())));
    }
}
