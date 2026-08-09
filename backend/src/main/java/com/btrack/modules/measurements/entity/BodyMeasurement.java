package com.btrack.modules.measurements.entity;

import com.btrack.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "body_measurements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(AuditingEntityListener.class)
public class BodyMeasurement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "weight_kg", precision = 5, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "body_fat_pct", precision = 4, scale = 1)
    private BigDecimal bodyFatPct;

    @Column(name = "waist_cm", precision = 5, scale = 1)
    private BigDecimal waistCm;

    @Column(name = "chest_cm", precision = 5, scale = 1)
    private BigDecimal chestCm;

    @Column(name = "left_arm_cm", precision = 5, scale = 1)
    private BigDecimal leftArmCm;

    @Column(name = "right_arm_cm", precision = 5, scale = 1)
    private BigDecimal rightArmCm;

    @Column(name = "left_thigh_cm", precision = 5, scale = 1)
    private BigDecimal leftThighCm;

    @Column(name = "right_thigh_cm", precision = 5, scale = 1)
    private BigDecimal rightThighCm;

    @Column(name = "shoulders_cm", precision = 5, scale = 1)
    private BigDecimal shouldersCm;

    @Column(name = "hips_cm", precision = 5, scale = 1)
    private BigDecimal hipsCm;

    @Column(name = "neck_cm", precision = 5, scale = 1)
    private BigDecimal neckCm;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
