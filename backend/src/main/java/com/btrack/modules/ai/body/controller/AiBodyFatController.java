package com.btrack.modules.ai.body.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.modules.ai.body.dto.AiBodyFatEstimateResponse;
import com.btrack.modules.ai.body.dto.AiBodyFatRequest;
import com.btrack.modules.ai.body.service.AiBodyFatService;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/body-fat")
@RequiredArgsConstructor
@Tag(name = "AI Body Fat")
public class AiBodyFatController {

    private final AiBodyFatService bodyFatService;

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Analyze body fat from photos (requires consent)")
    public ResponseEntity<ApiResponse<AiBodyFatEstimateResponse>> analyze(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @Valid @RequestPart("metadata") AiBodyFatRequest metadata,
            @RequestPart("photos") List<MultipartFile> photos) {
        return ResponseEntity.ok(ApiResponse.ok(
                bodyFatService.analyze(principal.getUserId(), metadata, photos)));
    }

    @PutMapping("/{estimateId}/save")
    @Operation(summary = "Save a body fat estimate to history")
    public ResponseEntity<ApiResponse<AiBodyFatEstimateResponse>> save(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID estimateId) {
        return ResponseEntity.ok(ApiResponse.ok(
                bodyFatService.saveEstimate(principal.getUserId(), estimateId)));
    }

    @GetMapping("/history")
    @Operation(summary = "Get saved body fat estimates")
    public ResponseEntity<ApiResponse<Page<AiBodyFatEstimateResponse>>> getHistory(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                bodyFatService.getHistory(principal.getUserId(), page, size)));
    }

    @DeleteMapping("/{estimateId}")
    @Operation(summary = "Delete a body fat estimate and its photos")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @PathVariable UUID estimateId) {
        bodyFatService.delete(principal.getUserId(), estimateId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
