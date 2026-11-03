package com.btrack.modules.session.entity;

import com.btrack.common.BaseEntity;
import com.btrack.modules.user.entity.User;
import com.btrack.modules.workout.entity.WorkoutDay;
import com.btrack.modules.workout.entity.WorkoutPlan;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workout_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutSession extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private WorkoutPlan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "day_id")
    private WorkoutDay day;

    @Column(length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "session_status")
    @Builder.Default
    private SessionStatus status = SessionStatus.IN_PROGRESS;

    @Column(name = "started_at", nullable = false)
    @Builder.Default
    private Instant startedAt = Instant.now();

    @Column(name = "paused_at")
    private Instant pausedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "total_volume_kg", precision = 10, scale = 2)
    private BigDecimal totalVolumeKg;

    @Column(name = "avg_heart_rate")
    private Integer avgHeartRate;

    @Column(name = "max_heart_rate")
    private Integer maxHeartRate;

    @Column(name = "active_calories", precision = 7, scale = 1)
    private BigDecimal activeCalories;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_synced", nullable = false)
    @Builder.Default
    private boolean synced = true;

    @Column(name = "local_session_id", length = 100)
    private String localSessionId;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<SessionExercise> exercises = new ArrayList<>();

    public enum SessionStatus { IN_PROGRESS, PAUSED, COMPLETED, ABANDONED }
}
