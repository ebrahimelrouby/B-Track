package com.btrack.modules.nutrition.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "food_categories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(AuditingEntityListener.class)
public class FoodCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "name_ar", length = 150)
    private String nameAr;

    @Column(name = "name_en", length = 150)
    private String nameEn;

    // Plain UUID FK (not @ManyToOne) — self-referencing parent, not
    // navigated as a relation today; matches FoodItem's convention for
    // FK columns that don't need eager object graphs.
    @Column(name = "parent_category_id")
    private UUID parentCategoryId;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
