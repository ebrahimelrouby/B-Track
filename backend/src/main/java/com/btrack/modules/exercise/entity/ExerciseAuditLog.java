package com.btrack.modules.exercise.entity;

import com.btrack.modules.user.entity.User;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "exercise_audit_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ExerciseAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_user_id")
    private User adminUser;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(name = "entity_type", nullable = false, length = 100)
    @Builder.Default
    private String entityType = "EXERCISE";

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "entity_name", length = 300)
    private String entityName;

    @Type(JsonType.class)
    @Column(name = "before_value", columnDefinition = "jsonb")
    private Map<String, Object> beforeValue;

    @Type(JsonType.class)
    @Column(name = "after_value", columnDefinition = "jsonb")
    private Map<String, Object> afterValue;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;
}
