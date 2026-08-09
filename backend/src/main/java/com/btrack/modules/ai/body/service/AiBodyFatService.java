package com.btrack.modules.ai.body.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.modules.ai.body.dto.AiBodyFatEstimateResponse;
import com.btrack.modules.ai.body.dto.AiBodyFatRequest;
import com.btrack.modules.ai.body.entity.AiBodyFatEstimate;
import com.btrack.modules.ai.body.entity.AiBodyFatPhoto;
import com.btrack.modules.ai.body.repository.AiBodyFatEstimateRepository;
import com.btrack.modules.ai.common.service.AiRateLimiter;
import com.btrack.modules.ai.provider.AiBodyFatResult;
import com.btrack.modules.ai.provider.AiProvider;
import com.btrack.modules.subscription.entity.Subscription;
import com.btrack.modules.subscription.service.SubscriptionService;
import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiBodyFatService {

    private static final String FEATURE = "AI_BODY_FAT_ESTIMATION";
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/webp"
    );
    // Photo placeholder until cloud storage is integrated
    private static final String PLACEHOLDER_URL = "local://body-photo/";

    private final AiBodyFatEstimateRepository estimateRepository;
    private final AiProvider aiProvider;
    private final AiRateLimiter rateLimiter;
    private final SubscriptionService subscriptionService;
    private final UserRepository userRepository;

    @Transactional
    public AiBodyFatEstimateResponse analyze(UUID userId, AiBodyFatRequest metadata,
                                              List<MultipartFile> photos) {
        subscriptionService.requireFeature(userId, Subscription.FeatureKey.AI_BODY_FAT_ESTIMATION);

        if (!metadata.consentGiven()) {
            throw new BTrackException("Consent is required before body analysis.",
                    HttpStatus.BAD_REQUEST, ErrorCode.AI_CONSENT_REQUIRED);
        }

        List<byte[]> imageData = new ArrayList<>();
        for (MultipartFile photo : photos) {
            validatePhoto(photo);
            try {
                imageData.add(photo.getBytes());
            } catch (IOException e) {
                throw new BTrackException("Failed to read photo data.",
                        HttpStatus.BAD_REQUEST, ErrorCode.AI_INVALID_IMAGE);
            }
        }

        AiProvider.BodyMeasurements measurements = new AiProvider.BodyMeasurements(
                metadata.heightCm() != null ? metadata.heightCm().doubleValue() : null,
                metadata.weightKg() != null ? metadata.weightKg().doubleValue() : null,
                metadata.age(),
                metadata.gender(),
                metadata.trainingExperience(),
                metadata.goal()
        );

        AiBodyFatResult result = aiProvider.estimateBodyFat(imageData, measurements);

        AiBodyFatEstimate estimate = AiBodyFatEstimate.builder()
                .user(userRepository.getReferenceById(userId))
                .minBodyFatPct(result.minBodyFatPct())
                .maxBodyFatPct(result.maxBodyFatPct())
                .confidenceScore(result.confidenceScore())
                .heightCm(metadata.heightCm())
                .weightKg(metadata.weightKg())
                .age(metadata.age())
                .gender(metadata.gender())
                .trainingExperience(metadata.trainingExperience())
                .goal(metadata.goal())
                .visualObservations(result.visualObservations())
                .recommendations(result.recommendations())
                .rawAiResponse(result.rawResponse())
                .consentGiven(true)
                .status(AiBodyFatEstimate.EstimateStatus.DRAFT)
                .build();

        estimateRepository.save(estimate);

        // Attach photo references (photos are not permanently stored unless user saves)
        for (int i = 0; i < photos.size(); i++) {
            AiBodyFatPhoto.PhotoAngle angle = getAngle(i);
            AiBodyFatPhoto photoEntity = AiBodyFatPhoto.builder()
                    .estimate(estimate)
                    .photoAngle(angle)
                    .storageUrl(PLACEHOLDER_URL + estimate.getId() + "/" + angle.name().toLowerCase())
                    .build();
            estimate.getPhotos().add(photoEntity);
        }

        rateLimiter.checkAndRecord(userId, FEATURE, result.tokensUsed(), result.responseTimeMs());
        return AiBodyFatEstimateResponse.from(estimate);
    }

    @Transactional
    public AiBodyFatEstimateResponse saveEstimate(UUID userId, UUID estimateId) {
        AiBodyFatEstimate estimate = estimateRepository.findByIdAndUserId(estimateId, userId)
                .orElseThrow(() -> BTrackException.notFound("Estimate not found", ErrorCode.AI_ESTIMATE_NOT_FOUND));
        estimate.setStatus(AiBodyFatEstimate.EstimateStatus.SAVED);
        return AiBodyFatEstimateResponse.from(estimateRepository.save(estimate));
    }

    public Page<AiBodyFatEstimateResponse> getHistory(UUID userId, int page, int size) {
        return estimateRepository.findByUserIdAndStatusOrderByCreatedAtDesc(
                userId,
                AiBodyFatEstimate.EstimateStatus.SAVED,
                PageRequest.of(page, size)
        ).map(AiBodyFatEstimateResponse::from);
    }

    @Transactional
    public void delete(UUID userId, UUID estimateId) {
        AiBodyFatEstimate estimate = estimateRepository.findByIdAndUserId(estimateId, userId)
                .orElseThrow(() -> BTrackException.notFound("Estimate not found", ErrorCode.AI_ESTIMATE_NOT_FOUND));
        // Cascade deletes photos via orphanRemoval
        estimateRepository.delete(estimate);
    }

    private void validatePhoto(MultipartFile photo) {
        String mimeType = photo.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new BTrackException("Only JPEG, PNG, and WebP images are accepted.",
                    HttpStatus.BAD_REQUEST, ErrorCode.AI_INVALID_IMAGE);
        }
        if (photo.getSize() > 10 * 1024 * 1024) {
            throw new BTrackException("Each image must be under 10MB.",
                    HttpStatus.BAD_REQUEST, ErrorCode.AI_INVALID_IMAGE);
        }
    }

    private AiBodyFatPhoto.PhotoAngle getAngle(int index) {
        return switch (index) {
            case 0 -> AiBodyFatPhoto.PhotoAngle.FRONT;
            case 1 -> AiBodyFatPhoto.PhotoAngle.SIDE;
            default -> AiBodyFatPhoto.PhotoAngle.BACK;
        };
    }
}
