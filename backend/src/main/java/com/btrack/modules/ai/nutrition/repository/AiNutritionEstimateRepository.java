package com.btrack.modules.ai.nutrition.repository;

import com.btrack.modules.ai.nutrition.entity.AiNutritionEstimate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiNutritionEstimateRepository extends JpaRepository<AiNutritionEstimate, UUID> {

    Page<AiNutritionEstimate> findByUserIdAndStatusOrderByCreatedAtDesc(
            UUID userId,
            AiNutritionEstimate.EstimateStatus status,
            Pageable pageable
    );

    Optional<AiNutritionEstimate> findByIdAndUserId(UUID id, UUID userId);
}
