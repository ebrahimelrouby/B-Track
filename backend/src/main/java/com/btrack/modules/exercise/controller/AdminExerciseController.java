package com.btrack.modules.exercise.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.common.response.PagedResponse;
import com.btrack.modules.auth.security.BTrackPrincipal;
import com.btrack.modules.exercise.dto.*;
import com.btrack.modules.exercise.entity.*;
import com.btrack.modules.exercise.repository.ExerciseAuditLogRepository;
import com.btrack.modules.exercise.service.AdminExerciseService;
import com.btrack.modules.exercise.service.ExerciseImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin — Exercise Management")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminExerciseController {

    private final AdminExerciseService exerciseService;
    private final ExerciseImportService importService;
    private final ExerciseAuditLogRepository auditLogRepository;

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @GetMapping("/dashboard/stats")
    @Operation(summary = "Admin dashboard statistics")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        return ResponseEntity.ok(ApiResponse.ok(exerciseService.getDashboardStats()));
    }

    // ── Exercise CRUD ─────────────────────────────────────────────────────────

    @GetMapping("/exercises")
    @Operation(summary = "List all exercises (admin, all statuses)")
    public ResponseEntity<ApiResponse<PagedResponse<AdminExerciseResponse>>> listExercises(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String muscleGroup,
            @RequestParam(required = false) String equipment,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String provider,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        return ResponseEntity.ok(ApiResponse.ok(
                exerciseService.listExercises(search, muscleGroup, equipment, status, provider, page, size)));
    }

    @GetMapping("/exercises/{id}")
    @Operation(summary = "Get exercise detail")
    public ResponseEntity<ApiResponse<AdminExerciseResponse>> getExercise(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(exerciseService.getExercise(id)));
    }

    @PostMapping("/exercises")
    @Operation(summary = "Create a new exercise")
    public ResponseEntity<ApiResponse<AdminExerciseResponse>> createExercise(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @Valid @RequestBody AdminExerciseRequest req,
            HttpServletRequest httpReq) {

        AdminExerciseResponse created = exerciseService.createExercise(req, principal.getUserId(), getIp(httpReq));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PutMapping("/exercises/{id}")
    @Operation(summary = "Update an exercise")
    public ResponseEntity<ApiResponse<AdminExerciseResponse>> updateExercise(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody AdminExerciseRequest req,
            HttpServletRequest httpReq) {

        return ResponseEntity.ok(ApiResponse.ok(
                exerciseService.updateExercise(id, req, principal.getUserId(), getIp(httpReq))));
    }

    @PatchMapping("/exercises/{id}/status")
    @Operation(summary = "Change exercise status")
    public ResponseEntity<ApiResponse<AdminExerciseResponse>> changeStatus(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ExerciseStatusRequest req,
            HttpServletRequest httpReq) {

        return ResponseEntity.ok(ApiResponse.ok(
                exerciseService.changeStatus(id, req, principal.getUserId(), getIp(httpReq))));
    }

    @PostMapping("/exercises/bulk-status")
    @Operation(summary = "Bulk status change")
    public ResponseEntity<ApiResponse<Integer>> bulkChangeStatus(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @Valid @RequestBody BulkStatusRequest req,
            HttpServletRequest httpReq) {

        int count = exerciseService.bulkChangeStatus(req, principal.getUserId(), getIp(httpReq));
        return ResponseEntity.ok(ApiResponse.ok("Updated " + count + " exercises", count));
    }

    @DeleteMapping("/exercises/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Soft-delete an exercise (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<Void>> deleteExercise(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID id,
            HttpServletRequest httpReq) {

        exerciseService.deleteExercise(id, principal.getUserId(), getIp(httpReq));
        return ResponseEntity.ok(ApiResponse.ok("Exercise deleted"));
    }

    // ── Media management ──────────────────────────────────────────────────────

    @GetMapping("/exercises/{id}/media")
    @Operation(summary = "List media for an exercise")
    public ResponseEntity<ApiResponse<List<ExerciseMedia>>> listMedia(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(exerciseService.listMedia(id)));
    }

    @PostMapping("/exercises/{id}/media")
    @Operation(summary = "Add media to an exercise")
    public ResponseEntity<ApiResponse<ExerciseMedia>> addMedia(
            @PathVariable UUID id,
            @Valid @RequestBody ExerciseMediaRequest req) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(exerciseService.addMedia(id, req)));
    }

    @DeleteMapping("/exercises/{exerciseId}/media/{mediaId}")
    @Operation(summary = "Remove media from an exercise")
    public ResponseEntity<ApiResponse<Void>> deleteMedia(
            @PathVariable UUID exerciseId,
            @PathVariable UUID mediaId) {

        exerciseService.deleteMedia(exerciseId, mediaId);
        return ResponseEntity.ok(ApiResponse.ok("Media removed"));
    }

    // ── Translations ──────────────────────────────────────────────────────────

    @GetMapping("/exercises/{id}/translations")
    @Operation(summary = "List translations for an exercise")
    public ResponseEntity<ApiResponse<List<ExerciseTranslation>>> listTranslations(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(exerciseService.listTranslations(id)));
    }

    @PutMapping("/exercises/{id}/translations/{locale}")
    @Operation(summary = "Create or update a translation")
    public ResponseEntity<ApiResponse<ExerciseTranslation>> saveTranslation(
            @PathVariable UUID id,
            @PathVariable String locale,
            @RequestBody TranslationRequest req) {

        return ResponseEntity.ok(ApiResponse.ok(exerciseService.saveTranslation(id, locale, req)));
    }

    // ── Duplicate detection ───────────────────────────────────────────────────

    @GetMapping("/exercises/{id}/duplicates")
    @Operation(summary = "Find potential duplicates of an exercise")
    public ResponseEntity<ApiResponse<List<AdminExerciseResponse>>> findDuplicates(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(exerciseService.findDuplicates(id)));
    }

    // ── Import pipeline ───────────────────────────────────────────────────────

    @GetMapping("/exercises/import/providers")
    @Operation(summary = "List available import providers")
    public ResponseEntity<ApiResponse<List<String>>> listProviders() {
        return ResponseEntity.ok(ApiResponse.ok(importService.listProviders()));
    }

    @PostMapping("/exercises/import")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Trigger exercise import (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<ExerciseImportHistory>> triggerImport(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @Valid @RequestBody ImportRequest req) {

        ExerciseImportHistory result = importService.startImport(req, principal.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    @GetMapping("/exercises/import/history")
    @Operation(summary = "Import history")
    public ResponseEntity<ApiResponse<PagedResponse<ExerciseImportHistory>>> getImportHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(ApiResponse.ok(importService.getHistory(page, size)));
    }

    @GetMapping("/exercises/import/{importId}")
    @Operation(summary = "Get import record detail")
    public ResponseEntity<ApiResponse<ExerciseImportHistory>> getImportRecord(@PathVariable UUID importId) {
        return ResponseEntity.ok(ApiResponse.ok(importService.getImportRecord(importId)));
    }

    // ── Audit log ─────────────────────────────────────────────────────────────

    @GetMapping("/audit-log")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Full audit log (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLogResponse>>> getAuditLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        var result = auditLogRepository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.from(result.map(AuditLogResponse::from))));
    }

    @GetMapping("/exercises/{id}/audit-log")
    @Operation(summary = "Exercise audit history")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLogResponse>>> getExerciseAuditLog(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        var result = auditLogRepository.findByEntityIdOrderByCreatedAtDesc(
                id, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.from(result.map(AuditLogResponse::from))));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String getIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        return forwarded != null ? forwarded.split(",")[0].trim() : req.getRemoteAddr();
    }
}
