package com.btrack.modules.exercise.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.common.response.PagedResponse;
import com.btrack.modules.exercise.dto.*;
import com.btrack.modules.exercise.entity.*;
import com.btrack.modules.exercise.repository.*;
import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminExerciseService {

    private final ExerciseRepository exerciseRepository;
    private final ExerciseMediaRepository mediaRepository;
    private final ExerciseTranslationRepository translationRepository;
    private final ExerciseImportHistoryRepository importHistoryRepository;
    private final ExerciseAuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ExerciseQualityService qualityService;
    private final ExerciseAuditService auditService;

    // ── List ─────────────────────────────────────────────────────────────────

    public PagedResponse<AdminExerciseResponse> listExercises(
            String search, String muscleGroup, String equipment,
            String status, String provider, int page, int size) {

        Exercise.MuscleGroup mg = muscleGroup != null ? Exercise.MuscleGroup.valueOf(muscleGroup) : null;
        Exercise.EquipmentType eq = equipment != null ? Exercise.EquipmentType.valueOf(equipment) : null;
        Exercise.ExerciseStatus st = status != null ? Exercise.ExerciseStatus.valueOf(status) : null;

        var result = exerciseRepository.adminSearchExercises(
                search, mg, eq, st, provider,
                PageRequest.of(page, size, Sort.by("name")));

        return PagedResponse.from(result.map(AdminExerciseResponse::from));
    }

    // ── Get one ──────────────────────────────────────────────────────────────

    public AdminExerciseResponse getExercise(UUID id) {
        return AdminExerciseResponse.from(findOrThrow(id));
    }

    // ── Create ───────────────────────────────────────────────────────────────

    @Transactional
    public AdminExerciseResponse createExercise(AdminExerciseRequest req, UUID adminUserId, String ipAddress) {
        String slug = resolveSlug(req.slug(), req.name(), null);

        Exercise.MuscleGroup mg = Exercise.MuscleGroup.valueOf(req.muscleGroup());
        List<Exercise.MuscleGroup> secondary = req.secondaryMuscles() != null
                ? req.secondaryMuscles().stream().map(Exercise.MuscleGroup::valueOf).toList()
                : null;

        Exercise ex = Exercise.builder()
                .name(req.name())
                .slug(slug)
                .muscleGroup(mg)
                .secondaryMuscles(secondary)
                .equipment(Exercise.EquipmentType.valueOf(req.equipment()))
                .difficulty(Exercise.Difficulty.valueOf(req.difficulty()))
                .description(req.description())
                .instructions(req.instructions())
                .tips(req.tips())
                .commonMistakes(req.commonMistakes())
                .imageUrl(req.imageUrl())
                .gifUrl(req.gifUrl())
                .category(req.category())
                .movementPattern(req.movementPattern())
                .mechanic(req.mechanic())
                .forceType(req.forceType())
                .tags(req.tags())
                .licenseType(req.licenseType() != null ? req.licenseType() : "unknown")
                .attribution(req.attribution())
                .sourceProvider(req.sourceProvider())
                .externalId(req.externalId())
                .status(Exercise.ExerciseStatus.DRAFT)
                .build();

        ex.setQualityScore(qualityService.calculate(ex));
        ex = exerciseRepository.save(ex);

        auditService.log(adminUserId, "CREATE", ex.getId(), ex.getName(), ipAddress);
        return AdminExerciseResponse.from(ex);
    }

    // ── Update ───────────────────────────────────────────────────────────────

    @Transactional
    public AdminExerciseResponse updateExercise(UUID id, AdminExerciseRequest req,
                                                UUID adminUserId, String ipAddress) {
        Exercise ex = findOrThrow(id);
        Map<String, Object> before = snapshotExercise(ex);

        String slug = resolveSlug(req.slug(), req.name(), ex.getId());
        ex.setName(req.name());
        ex.setSlug(slug);
        ex.setMuscleGroup(Exercise.MuscleGroup.valueOf(req.muscleGroup()));
        ex.setSecondaryMuscles(req.secondaryMuscles() != null
                ? req.secondaryMuscles().stream().map(Exercise.MuscleGroup::valueOf).toList()
                : null);
        ex.setEquipment(Exercise.EquipmentType.valueOf(req.equipment()));
        ex.setDifficulty(Exercise.Difficulty.valueOf(req.difficulty()));
        ex.setDescription(req.description());
        ex.setInstructions(req.instructions());
        ex.setTips(req.tips());
        ex.setCommonMistakes(req.commonMistakes());
        ex.setImageUrl(req.imageUrl());
        ex.setGifUrl(req.gifUrl());
        ex.setCategory(req.category());
        ex.setMovementPattern(req.movementPattern());
        ex.setMechanic(req.mechanic());
        ex.setForceType(req.forceType());
        ex.setTags(req.tags());
        ex.setLicenseType(req.licenseType() != null ? req.licenseType() : ex.getLicenseType());
        ex.setAttribution(req.attribution());
        ex.setSourceProvider(req.sourceProvider());
        ex.setExternalId(req.externalId());
        ex.setQualityScore(qualityService.calculate(ex));

        ex = exerciseRepository.save(ex);
        auditService.log(adminUserId, "UPDATE", ex.getId(), ex.getName(), before, snapshotExercise(ex), ipAddress);
        return AdminExerciseResponse.from(ex);
    }

    // ── Status transition ─────────────────────────────────────────────────────

    @Transactional
    public AdminExerciseResponse changeStatus(UUID id, ExerciseStatusRequest req,
                                              UUID adminUserId, String ipAddress) {
        Exercise ex = findOrThrow(id);
        Exercise.ExerciseStatus newStatus = Exercise.ExerciseStatus.valueOf(req.status());
        Exercise.ExerciseStatus oldStatus = ex.getStatus();

        ex.setStatus(newStatus);

        if (newStatus == Exercise.ExerciseStatus.PUBLISHED && ex.getPublishedAt() == null) {
            ex.setPublishedAt(Instant.now());
        }
        if (newStatus == Exercise.ExerciseStatus.REVIEWED) {
            ex.setReviewedBy(userRepository.getReferenceById(adminUserId));
            ex.setReviewedAt(Instant.now());
        }

        ex = exerciseRepository.save(ex);
        auditService.log(adminUserId, "STATUS_CHANGE", ex.getId(), ex.getName(),
                Map.of("status", oldStatus.name()), Map.of("status", newStatus.name(), "reason", req.reason() != null ? req.reason() : ""),
                ipAddress);
        return AdminExerciseResponse.from(ex);
    }

    // ── Bulk status ───────────────────────────────────────────────────────────

    @Transactional
    public int bulkChangeStatus(BulkStatusRequest req, UUID adminUserId, String ipAddress) {
        Exercise.ExerciseStatus newStatus = Exercise.ExerciseStatus.valueOf(req.status());
        int count = 0;
        for (UUID exId : req.exerciseIds()) {
            try {
                changeStatus(exId, new ExerciseStatusRequest(req.status(), req.reason()), adminUserId, ipAddress);
                count++;
            } catch (Exception ignored) {}
        }
        return count;
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteExercise(UUID id, UUID adminUserId, String ipAddress) {
        Exercise ex = findOrThrow(id);
        ex.setActive(false);
        exerciseRepository.save(ex);
        auditService.log(adminUserId, "DELETE", ex.getId(), ex.getName(), ipAddress);
    }

    // ── Media ─────────────────────────────────────────────────────────────────

    @Transactional
    public ExerciseMedia addMedia(UUID exerciseId, ExerciseMediaRequest req) {
        Exercise ex = findOrThrow(exerciseId);
        ExerciseMedia media = ExerciseMedia.builder()
                .exercise(ex)
                .mediaType(ExerciseMedia.MediaType.valueOf(req.mediaType()))
                .url(req.url())
                .provider(req.provider())
                .licenseType(req.licenseType())
                .author(req.author())
                .sourceUrl(req.sourceUrl())
                .attribution(req.attribution())
                .commercialUse(req.commercialUse())
                .displayOrder(req.displayOrder())
                .build();
        return mediaRepository.save(media);
    }

    public List<ExerciseMedia> listMedia(UUID exerciseId) {
        findOrThrow(exerciseId);
        return mediaRepository.findByExerciseIdOrderByDisplayOrderAsc(exerciseId);
    }

    @Transactional
    public void deleteMedia(UUID exerciseId, UUID mediaId) {
        findOrThrow(exerciseId);
        mediaRepository.deleteById(mediaId);
    }

    // ── Translations ──────────────────────────────────────────────────────────

    public List<ExerciseTranslation> listTranslations(UUID exerciseId) {
        findOrThrow(exerciseId);
        return translationRepository.findByExerciseId(exerciseId);
    }

    @Transactional
    public ExerciseTranslation saveTranslation(UUID exerciseId, String locale, TranslationRequest req) {
        Exercise ex = findOrThrow(exerciseId);
        ExerciseTranslation tr = translationRepository
                .findByExerciseIdAndLocale(exerciseId, locale)
                .orElseGet(() -> ExerciseTranslation.builder()
                        .exercise(ex)
                        .locale(locale)
                        .build());
        tr.setName(req.name());
        tr.setDescription(req.description());
        tr.setInstructions(req.instructions());
        tr.setTips(req.tips());
        tr.setCommonMistakes(req.commonMistakes());
        return translationRepository.save(tr);
    }

    // ── Dashboard stats ───────────────────────────────────────────────────────

    public DashboardStatsResponse getDashboardStats() {
        long total = exerciseRepository.count();
        var all = exerciseRepository.findAll();

        long published  = all.stream().filter(e -> e.getStatus() == Exercise.ExerciseStatus.PUBLISHED).count();
        long draft      = all.stream().filter(e -> e.getStatus() == Exercise.ExerciseStatus.DRAFT).count();
        long reviewed   = all.stream().filter(e -> e.getStatus() == Exercise.ExerciseStatus.REVIEWED).count();
        long archived   = all.stream().filter(e -> e.getStatus() == Exercise.ExerciseStatus.ARCHIVED).count();
        long rejected   = all.stream().filter(e -> e.getStatus() == Exercise.ExerciseStatus.REJECTED).count();
        long custom     = all.stream().filter(Exercise::isCustom).count();
        long imports    = importHistoryRepository.count();
        double avgScore = all.stream().mapToInt(Exercise::getQualityScore).average().orElse(0);

        Map<String, Long> byMuscle = new java.util.HashMap<>();
        Map<String, Long> byEquip  = new java.util.HashMap<>();
        Map<String, Long> byDifficulty = new java.util.HashMap<>();
        for (Exercise e : all) {
            if (e.getMuscleGroup() != null)
                byMuscle.merge(e.getMuscleGroup().name(), 1L, Long::sum);
            if (e.getEquipment() != null)
                byEquip.merge(e.getEquipment().name(), 1L, Long::sum);
            if (e.getDifficulty() != null)
                byDifficulty.merge(e.getDifficulty().name(), 1L, Long::sum);
        }

        Map<String, Long> qualityBuckets = new java.util.LinkedHashMap<>();
        qualityBuckets.put("POOR", 0L);
        qualityBuckets.put("FAIR", 0L);
        qualityBuckets.put("GREAT", 0L);
        for (Exercise e : all) {
            String bucket = e.getQualityScore() >= 80 ? "GREAT" : e.getQualityScore() >= 50 ? "FAIR" : "POOR";
            qualityBuckets.merge(bucket, 1L, Long::sum);
        }

        List<DashboardStatsResponse.ActivityPoint> activityTrend = buildActivityTrend();

        return new DashboardStatsResponse(total, published, draft, reviewed, archived, rejected,
                custom, imports, avgScore, byMuscle, byEquip, byDifficulty, qualityBuckets, activityTrend);
    }

    private List<DashboardStatsResponse.ActivityPoint> buildActivityTrend() {
        int days = 14;
        Instant since = Instant.now().minus(days, java.time.temporal.ChronoUnit.DAYS);
        var recentLogs = auditLogRepository.findByCreatedAtAfter(since);

        Map<java.time.LocalDate, Long> counts = recentLogs.stream().collect(java.util.stream.Collectors.groupingBy(
                log -> log.getCreatedAt().atZone(java.time.ZoneOffset.UTC).toLocalDate(),
                java.util.stream.Collectors.counting()));

        java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneOffset.UTC);
        List<DashboardStatsResponse.ActivityPoint> trend = new java.util.ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            java.time.LocalDate day = today.minusDays(i);
            trend.add(new DashboardStatsResponse.ActivityPoint(day.toString(), counts.getOrDefault(day, 0L)));
        }
        return trend;
    }

    // ── Duplicate detection ───────────────────────────────────────────────────

    public List<AdminExerciseResponse> findDuplicates(UUID exerciseId) {
        Exercise ex = findOrThrow(exerciseId);
        return exerciseRepository.findPotentialDuplicates(exerciseId, ex.getName(), ex.getSlug())
                .stream().map(AdminExerciseResponse::from).toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Exercise findOrThrow(UUID id) {
        return exerciseRepository.findById(id)
                .orElseThrow(() -> new BTrackException("Exercise not found", HttpStatus.NOT_FOUND, ErrorCode.EXERCISE_NOT_FOUND));
    }

    private String resolveSlug(String requestedSlug, String name, UUID excludeId) {
        String base = requestedSlug != null && !requestedSlug.isBlank()
                ? requestedSlug
                : name.toLowerCase().replaceAll("[^a-z0-9\\s-]", "").replaceAll("\\s+", "-").trim();

        String slug = base;
        int suffix = 1;
        while (exerciseRepository.existsBySlug(slug)
                && (excludeId == null || !exerciseRepository.findBySlug(slug).map(e -> e.getId().equals(excludeId)).orElse(false))) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }

    private Map<String, Object> snapshotExercise(Exercise e) {
        return Map.of(
                "name", e.getName() != null ? e.getName() : "",
                "status", e.getStatus() != null ? e.getStatus().name() : "",
                "qualityScore", e.getQualityScore()
        );
    }
}
