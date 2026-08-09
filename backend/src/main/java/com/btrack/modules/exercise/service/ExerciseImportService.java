package com.btrack.modules.exercise.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.common.response.PagedResponse;
import com.btrack.modules.exercise.dto.ImportRequest;
import com.btrack.modules.exercise.entity.Exercise;
import com.btrack.modules.exercise.entity.ExerciseImportHistory;
import com.btrack.modules.exercise.importer.ExerciseImportProvider;
import com.btrack.modules.exercise.repository.ExerciseImportHistoryRepository;
import com.btrack.modules.exercise.repository.ExerciseRepository;
import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExerciseImportService {

    private final List<ExerciseImportProvider> providers;
    private final ExerciseRepository exerciseRepository;
    private final ExerciseImportHistoryRepository historyRepository;
    private final ExerciseQualityService qualityService;
    private final UserRepository userRepository;

    public List<String> listProviders() {
        return providers.stream()
                .map(p -> p.getId() + " — " + p.getDisplayName())
                .toList();
    }

    @Transactional
    public ExerciseImportHistory startImport(ImportRequest req, UUID adminUserId) {
        ExerciseImportProvider provider = findProvider(req.provider());

        ExerciseImportHistory history = ExerciseImportHistory.builder()
                .provider(req.provider())
                .datasetVersion(req.datasetVersion() != null ? req.datasetVersion() : provider.getVersion())
                .status(ExerciseImportHistory.ImportStatus.PROCESSING)
                .importedBy(userRepository.getReferenceById(adminUserId))
                .startedAt(Instant.now())
                .build();
        history = historyRepository.save(history);

        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        int imported = 0, updated = 0, skipped = 0;
        long startMs = System.currentTimeMillis();

        try {
            List<Map<String, Object>> rawRecords = provider.load(req.options());
            log.info("Import: loaded {} raw records from {}", rawRecords.size(), req.provider());

            for (Map<String, Object> raw : rawRecords) {
                try {
                    String externalId = provider.extractExternalId(raw);

                    // Dedup check
                    if (exerciseRepository.existsByExternalIdAndSourceProvider(externalId, req.provider())) {
                        if (req.overwriteExisting()) {
                            // TODO: implement update path
                            warnings.add("Skipped update for existing: " + externalId);
                            skipped++;
                        } else {
                            skipped++;
                        }
                        continue;
                    }

                    Exercise.ExerciseBuilder builder = provider.map(raw);
                    Exercise exercise = builder.build();
                    exercise.setQualityScore(qualityService.calculate(exercise));

                    if (!req.dryRun()) {
                        exerciseRepository.save(exercise);
                    }
                    imported++;

                } catch (Exception ex) {
                    log.warn("Import record failed: {}", ex.getMessage());
                    errors.add(ex.getMessage());
                }
            }

            history.setStatus(ExerciseImportHistory.ImportStatus.COMPLETED);
        } catch (Exception ex) {
            log.error("Import pipeline failed: {}", ex.getMessage(), ex);
            errors.add("Pipeline error: " + ex.getMessage());
            history.setStatus(ExerciseImportHistory.ImportStatus.FAILED);
        }

        history.setImportedCount(imported);
        history.setUpdatedCount(updated);
        history.setSkippedCount(skipped);
        history.setErrorCount(errors.size());
        history.setWarningCount(warnings.size());
        history.setErrors(errors);
        history.setWarnings(warnings);
        history.setDurationMs(System.currentTimeMillis() - startMs);
        history.setCompletedAt(Instant.now());
        history.setReport(Map.of(
                "provider", req.provider(),
                "dryRun", req.dryRun(),
                "total", imported + skipped + errors.size()
        ));

        return historyRepository.save(history);
    }

    public PagedResponse<ExerciseImportHistory> getHistory(int page, int size) {
        return PagedResponse.from(historyRepository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))));
    }

    public ExerciseImportHistory getImportRecord(UUID importId) {
        return historyRepository.findById(importId)
                .orElseThrow(() -> new BTrackException("Import record not found",
                        HttpStatus.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND));
    }

    private ExerciseImportProvider findProvider(String id) {
        return providers.stream()
                .filter(p -> p.getId().equalsIgnoreCase(id))
                .findFirst()
                .orElseThrow(() -> new BTrackException(
                        "Unknown import provider: " + id,
                        HttpStatus.BAD_REQUEST,
                        ErrorCode.VALIDATION_ERROR));
    }
}
