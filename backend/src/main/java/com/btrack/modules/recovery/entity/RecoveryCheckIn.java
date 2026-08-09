package com.btrack.modules.recovery.entity;

import com.btrack.common.BaseEntity;
import com.btrack.modules.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "recovery_check_ins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecoveryCheckIn extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "energy_level", nullable = false)
    @Min(1) @Max(5)
    private Integer energyLevel;

    @Column(name = "soreness_level", nullable = false)
    @Min(1) @Max(5)
    private Integer sorenessLevel;

    @Column(name = "stress_level", nullable = false)
    @Min(1) @Max(5)
    private Integer stressLevel;

    @Column(name = "mood_level", nullable = false)
    @Min(1) @Max(5)
    private Integer moodLevel;

    @Column(name = "motivation_level", nullable = false)
    @Min(1) @Max(5)
    private Integer motivationLevel;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
