package com.btrack.modules.user.entity;

import com.btrack.common.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.hypersistence.utils.hibernate.type.array.EnumArrayType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile extends BaseEntity {

    // Breaks the User <-> UserProfile serialization cycle (User.profile is the
    // direction that should serialize, not this back-reference).
    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "gender_type")
    private GenderType gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @JdbcTypeCode(SqlTypes.NUMERIC)
    @Column(name = "height_cm", precision = 5, scale = 1)
    private Double heightCm;

    @JdbcTypeCode(SqlTypes.NUMERIC)
    @Column(name = "weight_kg", precision = 5, scale = 2)
    private Double weightKg;

    @JdbcTypeCode(SqlTypes.NUMERIC)
    @Column(name = "target_weight_kg", precision = 5, scale = 2)
    private Double targetWeightKg;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "fitness_goal", columnDefinition = "fitness_goal")
    private FitnessGoal fitnessGoal;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "activity_level", columnDefinition = "activity_level")
    private ActivityLevel activityLevel;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "training_experience", columnDefinition = "training_experience")
    private TrainingExperience trainingExperience;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "dietary_preference", columnDefinition = "dietary_preference")
    @Builder.Default
    private DietaryPreference dietaryPreference = DietaryPreference.NONE;

    @Column(name = "target_calories")
    private Integer targetCalories;

    @Column(name = "target_protein_g")
    private Integer targetProteinG;

    @Column(name = "target_carbs_g")
    private Integer targetCarbsG;

    @Column(name = "target_fats_g")
    private Integer targetFatsG;

    @Column(name = "target_water_ml")
    @Builder.Default
    private Integer targetWaterMl = 2500;

    @Column(name = "target_steps")
    @Builder.Default
    private Integer targetSteps = 10000;

    @JdbcTypeCode(SqlTypes.NUMERIC)
    @Column(name = "target_sleep_hours", precision = 3, scale = 1)
    @Builder.Default
    private Double targetSleepHours = 8.0;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    // Enums
    public enum GenderType { MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY }
    public enum FitnessGoal { LOSE_FAT, MAINTAIN, GAIN_MUSCLE }
    public enum ActivityLevel { SEDENTARY, LIGHTLY_ACTIVE, MODERATELY_ACTIVE, VERY_ACTIVE, EXTRA_ACTIVE }
    public enum TrainingExperience { BEGINNER, INTERMEDIATE, ADVANCED }
    public enum DietaryPreference { NONE, VEGETARIAN, VEGAN, KETO, PALEO, GLUTEN_FREE, DAIRY_FREE }
}
