package com.gmao.backend.audit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_logs_timestamp", columnList = "timestamp"),
    @Index(name = "idx_audit_logs_category", columnList = "category"),
    @Index(name = "idx_audit_logs_username", columnList = "username")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false, length = 20)
    private String category;

    @Column(nullable = false, length = 30)
    private String action;

    @Column(name = "user_id")
    private Long userId;

    @Column(length = 50)
    private String username;

    @Column(length = 20)
    private String role;

    @Column(length = 100)
    private String entity;

    @Column(name = "entity_id", length = 100)
    private String entityId;

    @Column(length = 10)
    private String method;

    @Column(length = 500)
    private String path;

    @Column(length = 45)
    private String ip;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "request_body", columnDefinition = "TEXT")
    private String requestBody;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "latency_ms")
    private Long latencyMs;

    @PrePersist
    public void prePersist() {
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
    }
}