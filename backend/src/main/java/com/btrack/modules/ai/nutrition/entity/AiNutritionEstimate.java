package com.btrack.modules.ai.nutrition.entity;

import com.btrack.common.BaseEntity;
import com.btrack.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "ai_nutrition_estimates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiNutritionEstimate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "input_type", nullable = false, columnDefinition = "ai_input_type")
    private InputType inputType;

    @Column(name = "input_text", columnDefinition = "TEXT")
    private String inputText;

    @Column(name = "food_name", length = 300)
    private String foodName;

    // AI-estimated values (before user edits)
    @Column(name = "estimated_calories", precision = 8, scale = 2)
    private BigDecimal estimatedCalories;

    @Column(name = "estimated_protein_g", precision = 7, scale = 2)
    private BigDecimal estimatedProteinG;

    @Column(name = "estimated_carbs_g", precision = 7, scale = 2)
    private BigDecimal estimatedCarbsG;

    @Column(name = "estimated_fat_g", precision = 7, scale = 2)
    private BigDecimal estimatedFatG;

    @Column(name = "estimated_fiber_g", precision = 7, scale = 2)
    private BigDecimal estimatedFiberG;

    @Column(name = "estimated_sugar_g", precision = 7, scale = 2)
    private BigDecimal estimatedSugarG;

    @Column(name = "estimated_sodium_mg", precision = 8, scale = 2)
    private BigDecimal estimatedSodiumMg;

    @Column(name = "estimated_serving_g", precision = 7, scale = 2)
    private BigDecimal estimatedServingG;

    // User-confirmed values (after editing)
    @Column(name = "confirmed_calories", precision = 8, scale = 2)
    private BigDecimal confirmedCalories;

    @Column(name = "confirmed_protein_g", precision = 7, scale = 2)
    private BigDecimal confirmedProteinG;

    @Column(name = "confirmed_carbs_g", precision = 7, scale = 2)
    private BigDecimal confirmedCarbsG;

    @Column(name = "confirmed_fat_g", precision = 7, scale = 2)
    private BigDecimal confirmedFatG;

    @Column(name = "confirmed_fiber_g", precision = 7, scale = 2)
    private BigDecimal confirmedFiberG;

    @Column(name = "confirmed_sugar_g", precision = 7, scale = 2)
    private BigDecimal confirmedSugarG;

    @Column(name = "confirmed_sodium_mg", precision = 8, scale = 2)
    private BigDecimal confirmedSodiumMg;

    @Column(name = "confirmed_serving_g", precision = 7, scale = 2)
    private BigDecimal confirmedServingG;

    @Column(name = "confidence_score", precision = 4, scale = 3)
    private BigDecimal confidenceScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "assumptions", columnDefinition = "jsonb")
    private List<String> assumptions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_ai_response", columnDefinition = "jsonb")
    private String rawAiResponse;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "ai_estimate_status")
    @Builder.Default
    private EstimateStatus status = EstimateStatus.DRAFT;

    @Column(name = "meal_type", length = 30)
    private String mealType;

    @Column(name = "logged_date")
    private LocalDate loggedDate;

    public enum InputType { TEXT, PHOTO, VOICE }
    public enum EstimateStatus { DRAFT, SAVED, DISCARDED }
}
