package com.btrack.modules.recovery.repository;

import com.btrack.modules.recovery.entity.RecoveryRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RecoveryRecommendationRepository extends JpaRepository<RecoveryRecommendation, UUID> {

    List<RecoveryRecommendation> findByRecoveryScoreIdOrderByPriorityAsc(UUID recoveryScoreId);
}
