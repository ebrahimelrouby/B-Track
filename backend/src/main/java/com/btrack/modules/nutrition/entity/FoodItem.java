package com.btrack.modules.nutrition.entity;

import jakarta.persistence.*;
import lombok.*;
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

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
