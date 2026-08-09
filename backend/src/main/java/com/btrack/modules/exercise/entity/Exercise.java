package com.btrack.modules.exercise.entity;

import com.btrack.common.BaseEntity;
import com.btrack.modules.user.entity.User;
import io.hypersistence.utils.hibernate.type.array.EnumArrayType;
import io.hypersistence.utils.hibernate.type.array.ListArrayType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Parameter;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exercise extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 300, unique = true)
    private String slug;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "muscle_group", nullable = false, columnDefinition = "muscle_group")
    private MuscleGroup muscleGroup;

    @Type(value = EnumArrayType.class, parameters = @Parameter(name = EnumArrayType.SQL_ARRAY_TYPE, value = "muscle_group"))
    @Column(name = "secondary_muscles", columnDefinition = "muscle_group[]")
    private List<MuscleGroup> secondaryMuscles;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "equipment_type")
    @Builder.Default
    private EquipmentType equipment = EquipmentType.BODYWEIGHT;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "exercise_difficulty")
    @Builder.Default
    private Difficulty difficulty = Difficulty.INTERMEDIATE;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(columnDefinition = "TEXT")
    private String tips;

    @Column(name = "common_mistakes", columnDefinition = "TEXT")
    private String commonMistakes;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "gif_url", length = 500)
    private String gifUrl;

    @Column(length = 100)
    private String category;

    @Column(name = "movement_pattern", length = 100)
    private String movementPattern;

    @Column(length = 50)
    private String mechanic;

    @Column(name = "force_type", length = 50)
    private String forceType;

    @Type(ListArrayType.class)
    @Column(columnDefinition = "text[]")
    private List<String> tags;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "exercise_status")
    @Builder.Default
    private ExerciseStatus status = ExerciseStatus.DRAFT;

    @Column(name = "quality_score", nullable = false)
    @Builder.Default
    private int qualityScore = 0;

    @Column(name = "license_type", length = 100)
    @Builder.Default
    private String licenseType = "unknown";

    @Column(columnDefinition = "TEXT")
    private String attribution;

    @Column(name = "source_provider", length = 100)
    private String sourceProvider;

    @Column(name = "external_id", length = 300)
    private String externalId;

    @Column(name = "published_at")
    private Instant publishedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "is_custom", nullable = false)
    @Builder.Default
    private boolean custom = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    public enum MuscleGroup {
        CHEST, BACK, SHOULDERS, BICEPS, TRICEPS, FOREARMS,
        CORE, GLUTES, QUADRICEPS, HAMSTRINGS, CALVES,
        FULL_BODY, CARDIO, OTHER
    }

    public enum EquipmentType {
        BARBELL, DUMBBELL, MACHINE, CABLE, BODYWEIGHT,
        KETTLEBELL, RESISTANCE_BAND, SMITH_MACHINE, OTHER
    }

    public enum Difficulty { BEGINNER, INTERMEDIATE, ADVANCED }

    public enum ExerciseStatus { DRAFT, REVIEWED, PUBLISHED, ARCHIVED, REJECTED }
}
