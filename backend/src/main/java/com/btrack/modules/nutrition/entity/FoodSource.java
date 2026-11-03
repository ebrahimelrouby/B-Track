package com.btrack.modules.nutrition.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

// Provenance of a FoodItem's data from a specific provider — supports
// future duplicate detection/reconciliation when the same food exists
// across multiple providers (one FoodItem can have multiple FoodSource
// rows, one per provider it was matched/imported from).
@Entity
@Table(name = "food_sources")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(AuditingEntityListener.class)
public class FoodSource {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_item_id", nullable = false)
    private FoodItem foodItem;

    @Column(nullable = false, length = 100)
    private String provider;

    @Column(name = "external_id", length = 300)
    private String externalId;

    @Column(name = "source_url", length = 2000)
    private String sourceUrl;

    @Column(length = 200)
    private String license;

    @Column(columnDefinition = "TEXT")
    private String attribution;

    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
