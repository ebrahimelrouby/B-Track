package com.btrack.modules.exercise.dto;

import com.btrack.modules.exercise.entity.ExerciseAuditLog;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID adminUserId,
        String adminEmail,
        String action,
        String entityType,
        UUID entityId,
        String entityName,
        Map<String, Object> beforeValue,
        Map<String, Object> afterValue,
        String ipAddress,
        Instant createdAt
) {
    public static AuditLogResponse from(ExerciseAuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getAdminUser() != null ? log.getAdminUser().getId() : null,
                log.getAdminUser() != null ? log.getAdminUser().getEmail() : null,
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getEntityName(),
                log.getBeforeValue(),
                log.getAfterValue(),
                log.getIpAddress(),
                log.getCreatedAt()
        );
    }
}
