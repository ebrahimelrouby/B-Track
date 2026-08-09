package com.btrack.modules.session.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workout_sets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class WorkoutSet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_exercise_id", nullable = false)
    private SessionExercise sessionExercise;

    @Column(name = "set_number", nullable = false)
    private int setNumber;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "set_type", nullable = false, columnDefinition = "set_type")
    @Builder.Default
    private SetType setType = SetType.NORMAL;

    @Column(name = "weight_kg", precision = 6, scale = 2)
    private BigDecimal weightKg;

    private Integer reps;

    @Column(precision = 3, scale = 1)
    private BigDecimal rpe;

    @Column(name = "rest_seconds")
    private Integer restSeconds;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private boolean completed = false;

    @Column(name = "completed_at")
    private Instant completedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public enum SetType { NORMAL, WARMUP, DROP_SET, FAILURE }
}
