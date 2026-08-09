package com.btrack.modules.ai.body.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_body_fat_photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiBodyFatPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estimate_id", nullable = false)
    private AiBodyFatEstimate estimate;

    @Enumerated(EnumType.STRING)
    @Column(name = "photo_angle", length = 20, nullable = false)
    private PhotoAngle photoAngle;

    @Column(name = "storage_url", length = 500, nullable = false)
    private String storageUrl;

    @Column(name = "uploaded_at", nullable = false)
    @Builder.Default
    private Instant uploadedAt = Instant.now();

    public enum PhotoAngle { FRONT, SIDE, BACK }
}
