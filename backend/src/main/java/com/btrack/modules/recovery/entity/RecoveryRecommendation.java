package com.btrack.modules.recovery.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

// No updated_at → not extending BaseEntity
@Entity
@Table(name = "recovery_recommendations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecoveryRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recovery_score_id", nullable = false)
    private RecoveryScore recoveryScore;

    @Column(name = "type", length = 50, nullable = false)
    private String type;

    @Column(name = "title", length = 200, nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "priority", nullable = false)
    @Builder.Default
    private int priority = 1;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public enum Type { TRAINING, SLEEP, HYDRATION, NUTRITION, GENERAL }
}
