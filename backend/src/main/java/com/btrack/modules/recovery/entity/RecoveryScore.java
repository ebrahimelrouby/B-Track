package com.btrack.modules.recovery.entity;

import com.btrack.common.BaseEntity;
import com.btrack.modules.user.entity.User;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "recovery_scores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecoveryScore extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "score_date", nullable = false)
    private LocalDate scoreDate;

    @Column(name = "final_score", nullable = false)
    private Integer finalScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "recovery_level", nullable = false, length = 60)
    private RecoveryLevel recoveryLevel;

    @Column(name = "confidence", nullable = false, precision = 4, scale = 3)
    @Builder.Default
    private BigDecimal confidence = BigDecimal.ONE;

    // Individual component scores (0-100)
    @Column(name = "sleep_score")
    private Integer sleepScore;

    @Column(name = "training_load_score")
    private Integer trainingLoadScore;

    @Column(name = "heart_recovery_score")
    private Integer heartRecoveryScore;

    @Column(name = "hydration_score")
    private Integer hydrationScore;

    @Column(name = "subjective_wellness_score")
    private Integer subjectiveWellnessScore;

    // Full component detail (status + explanation) stored as JSONB for fast reads
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "components", columnDefinition = "jsonb")
    private Map<String, Object> components;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "missing_data", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> missingData = new ArrayList<>();

    @OneToMany(mappedBy = "recoveryScore", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.LAZY)
    @OrderBy("priority ASC")
    @Builder.Default
    private List<RecoveryRecommendation> recommendations = new ArrayList<>();

    public enum RecoveryLevel {
        READY_FOR_HEAVY_TRAINING,
        READY_FOR_NORMAL_TRAINING,
        MODERATE_TRAINING_RECOMMENDED,
        LIGHT_ACTIVITY_RECOMMENDED,
        REST_RECOMMENDED
    }
}
