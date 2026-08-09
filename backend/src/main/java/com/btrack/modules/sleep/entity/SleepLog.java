package com.btrack.modules.sleep.entity;

import com.btrack.common.BaseEntity;
import com.btrack.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "sleep_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SleepLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "sleep_start", nullable = false)
    private Instant sleepStart;

    @Column(name = "sleep_end", nullable = false)
    private Instant sleepEnd;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "quality_score")
    private Integer qualityScore;

    @Column(name = "source", length = 100)
    private String source;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    // V9 additions
    @Column(name = "fell_asleep_at")
    private Instant fellAsleepAt;

    @Column(name = "wake_time")
    private Instant wakeTime;

    @Column(name = "mood_after_sleep", length = 20)
    private String moodAfterSleep;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
