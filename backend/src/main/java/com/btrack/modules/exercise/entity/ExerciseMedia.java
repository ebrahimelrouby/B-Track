package com.btrack.modules.exercise.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "exercise_media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ExerciseMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 50)
    private MediaType mediaType;

    @Column(nullable = false, length = 2000)
    private String url;

    @Column(length = 200)
    private String provider;

    @Column(name = "license_type", length = 100)
    private String licenseType;

    @Column(length = 200)
    private String author;

    @Column(name = "source_url", length = 2000)
    private String sourceUrl;

    @Column(columnDefinition = "TEXT")
    private String attribution;

    @Column(name = "commercial_use")
    @Builder.Default
    private boolean commercialUse = false;

    @Column(name = "display_order")
    @Builder.Default
    private int displayOrder = 0;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum MediaType {
        IMAGE, GIF, VIDEO, THUMBNAIL, SVG_OVERLAY, LOTTIE
    }
}
