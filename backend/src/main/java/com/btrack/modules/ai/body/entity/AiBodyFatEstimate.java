package com.btrack.modules.ai.body.entity;

import com.btrack.common.BaseEntity;
import com.btrack.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ai_body_fat_estimates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiBodyFatEstimate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "min_body_fat_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal minBodyFatPct;

    @Column(name = "max_body_fat_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal maxBodyFatPct;

    @Column(name = "confidence_score", precision = 4, scale = 3)
    private BigDecimal confidenceScore;

    @Column(name = "height_cm", precision = 6, scale = 2)
    private BigDecimal heightCm;

    @Column(name = "weight_kg", precision = 6, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "age")
    private Integer age;

    @Column(name = "gender", length = 30)
    private String gender;

    @Column(name = "training_experience", length = 30)
    private String trainingExperience;

    @Column(name = "goal", length = 50)
    private String goal;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "visual_observations", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> visualObservations = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "recommendations", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> recommendations = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_ai_response", columnDefinition = "jsonb")
    private String rawAiResponse;

    @Column(name = "consent_given", nullable = false)
    @Builder.Default
    private boolean consentGiven = false;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "ai_estimate_status")
    @Builder.Default
    private EstimateStatus status = EstimateStatus.DRAFT;

    @OneToMany(mappedBy = "estimate", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AiBodyFatPhoto> photos = new ArrayList<>();

    public enum EstimateStatus { DRAFT, SAVED, DISCARDED }
}
