package com.btrack.modules.exercise.service;

import com.btrack.modules.exercise.entity.ExerciseAuditLog;
import com.btrack.modules.exercise.repository.ExerciseAuditLogRepository;
import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExerciseAuditService {

    private final ExerciseAuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UUID adminUserId, String action, UUID entityId, String entityName,
                    Map<String, Object> before, Map<String, Object> after, String ipAddress) {
        ExerciseAuditLog entry = ExerciseAuditLog.builder()
                .adminUser(adminUserId != null ? userRepository.getReferenceById(adminUserId) : null)
                .action(action)
                .entityId(entityId)
                .entityName(entityName)
                .beforeValue(before)
                .afterValue(after)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(entry);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UUID adminUserId, String action, UUID entityId, String entityName, String ipAddress) {
        log(adminUserId, action, entityId, entityName, null, null, ipAddress);
    }
}
