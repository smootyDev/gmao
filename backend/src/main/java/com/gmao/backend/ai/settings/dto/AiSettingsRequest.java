package com.gmao.backend.ai.settings.dto;

public record AiSettingsRequest(
    String provider,
    String model,
    String baseUrl,
    String username,
    String apiKey,
    Double temperature,
    Integer maxTokens,
    Long timeoutMs
) {
}