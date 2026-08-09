package com.btrack.modules.ai.nutrition.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.modules.ai.common.service.AiRateLimiter;
import com.btrack.modules.ai.nutrition.dto.AiNutritionEstimateResponse;
import com.btrack.modules.ai.nutrition.dto.AiNutritionSaveRequest;
import com.btrack.modules.ai.nutrition.dto.AiNutritionTextRequest;
import com.btrack.modules.ai.nutrition.entity.AiNutritionEstimate;
import com.btrack.modules.ai.nutrition.repository.AiNutritionEstimateRepository;
import com.btrack.modules.ai.provider.AiNutritionResult;
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
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiNutritionService {

    private static final String FEATURE = "AI_FOOD_ESTIMATION";
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/webp"
    );

    private final AiNutritionEstimateRepository estimateRepository;
    private final AiProvider aiProvider;
    private final AiRateLimiter rateLimiter;
    private final SubscriptionService subscriptionService;
    private final UserRepository userRepository;

    @Transactional
    public AiNutritionEstimateResponse estimateFromText(UUID userId, AiNutritionTextRequest request) {
        subscriptionService.requireFeature(userId, Subscription.FeatureKey.AI_FOOD_ESTIMATION);
        rateLimiter.checkAndRecord(userId, FEATURE, 0, 0);

        AiNutritionResult result = aiProvider.estimateNutritionFromText(request.description());

        AiNutritionEstimate estimate = buildEstimate(userId, result,
                AiNutritionEstimate.InputType.TEXT, request.description());
        estimateRepository.save(estimate);

        rateLimiter.checkAndRecord(userId, FEATURE, result.tokensUsed(), result.responseTimeMs());
        return AiNutritionEstimateResponse.from(estimate);
    }

    @Transactional
    public AiNutritionEstimateResponse estimateFromPhoto(UUID userId, MultipartFile photo) {
        subscriptionService.requireFeature(userId, Subscription.FeatureKey.AI_FOOD_ESTIMATION);

        String mimeType = photo.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new BTrackException("Only JPEG, PNG, and WebP images are accepted.",
                    HttpStatus.BAD_REQUEST, ErrorCode.AI_INVALID_IMAGE);
        }
        if (photo.getSize() > 10 * 1024 * 1024) {
            throw new BTrackException("Image must be under 10MB.",
                    HttpStatus.BAD_REQUEST, ErrorCode.AI_INVALID_IMAGE);
        }

        byte[] imageData;
        try {
            imageData = photo.getBytes();
        } catch (IOException e) {
            throw new BTrackException("Failed to read image data.",
                    HttpStatus.BAD_REQUEST, ErrorCode.AI_INVALID_IMAGE);
        }

        AiNutritionResult result = aiProvider.estimateNutritionFromPhoto(imageData, mimeType);

        AiNutritionEstimate estimate = buildEstimate(userId, result,
                AiNutritionEstimate.InputType.PHOTO, null);
        estimateRepository.save(estimate);

        rateLimiter.checkAndRecord(userId, FEATURE, result.tokensUsed(), result.responseTimeMs());
        return AiNutritionEstimateResponse.from(estimate);
    }

    @Transactional
    public AiNutritionEstimateResponse saveEstimate(UUID userId, UUID estimateId, AiNutritionSaveRequest request) {
        AiNutritionEstimate estimate = estimateRepository.findByIdAndUserId(estimateId, userId)
                .orElseThrow(() -> BTrackException.notFound("Estimate not found", ErrorCode.AI_ESTIMATE_NOT_FOUND));

        estimate.setFoodName(request.foodName());
        estimate.setConfirmedCalories(request.calories());
        estimate.setConfirmedProteinG(request.proteinG());
        estimate.setConfirmedCarbsG(request.carbsG());
        estimate.setConfirmedFatG(request.fatG());
        estimate.setConfirmedFiberG(request.fiberG());
        estimate.setConfirmedSugarG(request.sugarG());
        estimate.setConfirmedSodiumMg(request.sodiumMg());
        estimate.setConfirmedServingG(request.servingG());
        estimate.setMealType(request.mealType());
        estimate.setLoggedDate(request.loggedDate() != null
                ? LocalDate.parse(request.loggedDate()) : LocalDate.now());
        estimate.setStatus(AiNutritionEstimate.EstimateStatus.SAVED);

        return AiNutritionEstimateResponse.from(estimateRepository.save(estimate));
    }

    public Page<AiNutritionEstimateResponse> getHistory(UUID userId, int page, int size) {
        return estimateRepository.findByUserIdAndStatusOrderByCreatedAtDesc(
                userId,
                AiNutritionEstimate.EstimateStatus.SAVED,
                PageRequest.of(page, size)
        ).map(AiNutritionEstimateResponse::from);
    }

    @Transactional
    public void delete(UUID userId, UUID estimateId) {
        AiNutritionEstimate estimate = estimateRepository.findByIdAndUserId(estimateId, userId)
                .orElseThrow(() -> BTrackException.notFound("Estimate not found", ErrorCode.AI_ESTIMATE_NOT_FOUND));
        estimateRepository.delete(estimate);
    }

    private AiNutritionEstimate buildEstimate(UUID userId, AiNutritionResult result,
                                               AiNutritionEstimate.InputType inputType,
                                               String inputText) {
        return AiNutritionEstimate.builder()
                .user(userRepository.getReferenceById(userId))
                .inputType(inputType)
                .inputText(inputText)
                .foodName(result.foodName())
                .estimatedCalories(result.calories())
                .estimatedProteinG(result.proteinG())
                .estimatedCarbsG(result.carbsG())
                .estimatedFatG(result.fatG())
                .estimatedFiberG(result.fiberG())
                .estimatedSugarG(result.sugarG())
                .estimatedSodiumMg(result.sodiumMg())
                .estimatedServingG(result.servingG())
                .confidenceScore(result.confidenceScore())
                .assumptions(result.assumptions())
                .rawAiResponse(result.rawResponse())
                .status(AiNutritionEstimate.EstimateStatus.DRAFT)
                .build();
    }
}
