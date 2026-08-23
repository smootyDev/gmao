package com.gmao.backend.ai.settings.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "ai_settings",
    uniqueConstraints = @UniqueConstraint(name = "uq_ai_settings_provider", columnNames = "provider"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String provider = "openai";

    @Column(length = 100)
    private String model;

    @Column(name = "base_url", length = 500)
    private String baseUrl;

    @Column(length = 100)
    private String username;

    @Column(name = "api_key_cipher", length = 1000)
    private String apiKeyCipher;

    @Column(name = "api_key_iv", length = 100)
    private String apiKeyIv;

    private Double temperature;

    @Column(name = "max_tokens")
    private Integer maxTokens;

    @Column(name = "timeout_ms", nullable = false)
    @Builder.Default
    private Long timeoutMs = 30000L;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = false;

    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PrePersist
    @PreUpdate
    public void touch() {
        this.updatedAt = Instant.now();
    }
}