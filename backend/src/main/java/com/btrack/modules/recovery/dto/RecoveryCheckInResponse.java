package com.btrack.modules.recovery.dto;

import com.btrack.modules.recovery.entity.RecoveryCheckIn;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RecoveryCheckInResponse(
        UUID id,
        LocalDate date,
        int energyLevel,
        int sorenessLevel,
        int stressLevel,
        int moodLevel,
        int motivationLevel,
        String notes,
        Instant createdAt
) {
    public static RecoveryCheckInResponse from(RecoveryCheckIn ci) {
        return new RecoveryCheckInResponse(
                ci.getId(),
                ci.getCheckInDate(),
                ci.getEnergyLevel(),
                ci.getSorenessLevel(),
                ci.getStressLevel(),
                ci.getMoodLevel(),
                ci.getMotivationLevel(),
                ci.getNotes(),
                ci.getCreatedAt()
        );
    }
}
