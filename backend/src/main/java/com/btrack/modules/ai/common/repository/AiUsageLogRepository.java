package com.btrack.modules.ai.common.repository;

import com.btrack.modules.ai.common.entity.AiUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, UUID> {

    @Query("""
            SELECT COUNT(l) FROM AiUsageLog l
            WHERE l.user.id = :userId
            AND l.feature = :feature
            AND l.requestAt >= :since
            """)
    long countByUserAndFeatureSince(@Param("userId") UUID userId,
                                    @Param("feature") String feature,
                                    @Param("since") Instant since);
}
