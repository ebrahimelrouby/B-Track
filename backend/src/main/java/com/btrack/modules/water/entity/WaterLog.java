package com.btrack.modules.water.entity;

import com.btrack.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

// water_logs has only created_at (no updated_at) so we do not extend BaseEntity
@Entity
@Table(name = "water_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "amount_ml", nullable = false)
    private Integer amountMl;

    @Column(name = "logged_at", nullable = false)
    @Builder.Default
    private Instant loggedAt = Instant.now();

    @Column(name = "notes", length = 200)
    private String notes;

    @Column(name = "drink_type", length = 50, nullable = false)
    @Builder.Default
    private String drinkType = "WATER";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;
}
