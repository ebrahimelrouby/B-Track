package com.btrack.modules.exercise.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record BulkStatusRequest(
        @NotEmpty List<UUID> exerciseIds,
        @NotBlank String status,
        String reason
) {}
