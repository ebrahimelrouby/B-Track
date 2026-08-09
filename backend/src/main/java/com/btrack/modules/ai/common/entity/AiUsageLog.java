package com.btrack.modules.ai.common.entity;

import com.btrack.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_usage_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiUsageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "request_at", nullable = false)
    @Builder.Default
    private Instant requestAt = Instant.now();

    @Column(name = "tokens_used")
    private Integer tokensUsed;

    @Column(name = "feature", length = 60)
    private String feature;

    @Column(name = "provider", length = 60)
    private String provider;

    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "response_time_ms")
    private Integer responseTimeMs;

    @Column(name = "estimated_cost_usd", precision = 10, scale = 6)
    private BigDecimal estimatedCostUsd;
}
