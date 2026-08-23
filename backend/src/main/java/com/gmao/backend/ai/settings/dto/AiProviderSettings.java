package com.gmao.backend.ai.settings.dto;

public record AiProviderSettings(
    String provider,
    String model,
    String baseUrl,
    String username,
    boolean apiKeyConfigured,
    Double temperature,
    Integer maxTokens,
    Long timeoutMs,
    boolean isActive
) {
}