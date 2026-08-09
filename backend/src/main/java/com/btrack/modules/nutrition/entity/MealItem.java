package com.btrack.modules.nutrition.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "meal_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(AuditingEntityListener.class)
public class MealItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_id", nullable = false)
    private Meal meal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_item_id", nullable = false)
    private FoodItem foodItem;

    @Column(nullable = false, precision = 7, scale = 2)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(name = "serving_size_g", nullable = false, precision = 7, scale = 2)
    private BigDecimal servingSizeG;

    // Calculated at log time
    @Column(nullable = false, precision = 7, scale = 1)
    private BigDecimal calories;

    @Column(name = "protein_g", nullable = false, precision = 7, scale = 2)
    private BigDecimal proteinG;

    @Column(name = "carbs_g", nullable = false, precision = 7, scale = 2)
    private BigDecimal carbsG;

    @Column(name = "fats_g", nullable = false, precision = 7, scale = 2)
    private BigDecimal fatsG;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
