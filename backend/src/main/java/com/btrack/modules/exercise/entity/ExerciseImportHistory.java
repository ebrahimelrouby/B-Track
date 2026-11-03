package com.btrack.modules.exercise.entity;

import com.btrack.modules.user.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "exercise_import_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ExerciseImportHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String provider;

    @Column(name = "dataset_version", length = 100)
    private String datasetVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ImportStatus status = ImportStatus.PENDING;

    @Column(name = "imported_count")
    @Builder.Default
    private int importedCount = 0;

    @Column(name = "updated_count")
    @Builder.Default
    private int updatedCount = 0;

    @Column(name = "skipped_count")
    @Builder.Default
    private int skippedCount = 0;

    @Column(name = "error_count")
    @Builder.Default
    private int errorCount = 0;

    @Column(name = "warning_count")
    @Builder.Default
    private int warningCount = 0;

    @Column(name = "media_count")
    @Builder.Default
    private int mediaCount = 0;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> errors;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> warnings;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> report;

    // Lazy FK, only needed for the DB audit trail — a raw Hibernate proxy
    // here breaks Jackson serialization since the controller returns this
    // entity directly rather than through a response DTO.
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "imported_by")
    private User importedBy;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "rolled_back_at")
    private Instant rolledBackAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    public enum ImportStatus { PENDING, PROCESSING, COMPLETED, FAILED, ROLLED_BACK }
}
