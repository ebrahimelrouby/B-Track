package com.btrack.modules.nutrition.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "food_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(AuditingEntityListener.class)
public class FoodItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 300)
    private String name;

    @Column(length = 200)
    private String brand;

    @Column(length = 50)
    private String barcode;

    @Column(name = "serving_size_g", precision = 7, scale = 2)
    @Builder.Default
    private BigDecimal servingSizeG = BigDecimal.valueOf(100);

    @Column(name = "serving_unit", length = 50)
    @Builder.Default
    private String servingUnit = "g";

    @Column(nullable = false, precision = 7, scale = 1)
    private BigDecimal calories;

    @Column(name = "protein_g", nullable = false, precision = 7, scale = 2)
    @Builder.Default
    private BigDecimal proteinG = BigDecimal.ZERO;

    @Column(name = "carbs_g", nullable = false, precision = 7, scale = 2)
    @Builder.Default
    private BigDecimal carbsG = BigDecimal.ZERO;

    @Column(name = "fats_g", nullable = false, precision = 7, scale = 2)
    @Builder.Default
    private BigDecimal fatsG = BigDecimal.ZERO;

    @Column(name = "fiber_g", precision = 7, scale = 2)
    private BigDecimal fiberG;

    @Column(name = "sugar_g", precision = 7, scale = 2)
    private BigDecimal sugarG;

    @Column(name = "sodium_mg", precision = 7, scale = 2)
    private BigDecimal sodiumMg;

    @Column(name = "is_custom", nullable = false)
    @Builder.Default
    private boolean custom = false;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean verified = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    // ── Phase 1 food-database additions ─────────────────────────────────────
    // Plain UUID FKs (not @ManyToOne), matching this entity's existing
    // `createdBy` convention — these aren't navigated as relations today.

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "brand_id")
    private UUID brandId;

    @Column(name = "data_source", nullable = false, length = 50)
    @Builder.Default
    private String dataSource = "MANUAL";

    @Column(name = "external_source_id", length = 300)
    private String externalSourceId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "verification_status", nullable = false, columnDefinition = "food_verification_status")
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.UNVERIFIED;

    @Column(length = 100)
    private String country;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum VerificationStatus {
        UNVERIFIED, VERIFIED, REVIEW_REQUIRED, REJECTED
    }
}
