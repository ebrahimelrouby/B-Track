package com.btrack.modules.ai.body.repository;

import com.btrack.modules.ai.body.entity.AiBodyFatEstimate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiBodyFatEstimateRepository extends JpaRepository<AiBodyFatEstimate, UUID> {

    Page<AiBodyFatEstimate> findByUserIdAndStatusOrderByCreatedAtDesc(
            UUID userId,
            AiBodyFatEstimate.EstimateStatus status,
            Pageable pageable
    );

    Optional<AiBodyFatEstimate> findByIdAndUserId(UUID id, UUID userId);
}
