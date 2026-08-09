package com.btrack.modules.measurements.service;

import com.btrack.modules.measurements.dto.BodyMeasurementRequest;
import com.btrack.modules.measurements.dto.BodyMeasurementResponse;
import com.btrack.modules.measurements.entity.BodyMeasurement;
import com.btrack.modules.measurements.repository.BodyMeasurementRepository;
import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MeasurementService {

    private final BodyMeasurementRepository repo;
    private final UserRepository userRepository;

    @Transactional
    public BodyMeasurementResponse save(UUID userId, BodyMeasurementRequest req) {
        BodyMeasurement m = repo.findByUserIdAndDate(userId, req.date())
                .orElse(BodyMeasurement.builder()
                        .user(userRepository.getReferenceById(userId))
                        .date(req.date())
                        .build());

        m.setWeightKg(req.weightKg());
        m.setBodyFatPct(req.bodyFatPct());
        m.setWaistCm(req.waistCm());
        m.setChestCm(req.chestCm());
        m.setLeftArmCm(req.leftArmCm());
        m.setRightArmCm(req.rightArmCm());
        m.setLeftThighCm(req.leftThighCm());
        m.setRightThighCm(req.rightThighCm());
        m.setShouldersCm(req.shouldersCm());
        m.setHipsCm(req.hipsCm());
        m.setNeckCm(req.neckCm());
        m.setNotes(req.notes());
        return toResponse(repo.save(m));
    }

    public List<BodyMeasurementResponse> getHistory(UUID userId, int days) {
        LocalDate from = LocalDate.now().minusDays(days - 1L);
        return repo.findByUserIdSince(userId, from).stream().map(this::toResponse).toList();
    }

    public List<BodyMeasurementResponse> getAll(UUID userId) {
        return repo.findAllByUserIdOrderByDateDesc(userId).stream().map(this::toResponse).toList();
    }

    private BodyMeasurementResponse toResponse(BodyMeasurement m) {
        return new BodyMeasurementResponse(
                m.getId(), m.getDate(),
                m.getWeightKg(), m.getBodyFatPct(),
                m.getWaistCm(), m.getChestCm(),
                m.getLeftArmCm(), m.getRightArmCm(),
                m.getLeftThighCm(), m.getRightThighCm(),
                m.getShouldersCm(), m.getHipsCm(), m.getNeckCm(),
                m.getNotes(),
                m.getCreatedAt() != null ? m.getCreatedAt().toString() : null
        );
    }
}
