package com.gmao.backend.ai.provider;

public record AiCallSettings(
    AiProviderName provider,
    String model,
    String baseUrl,
    String apiKey,
    String username,
    Double temperature,
    Integer maxTokens,
    long timeoutMs
) {

    public static AiCallSettings defaults(AiProviderName provider) {
        return new AiCallSettings(provider, null, null, null, null, 0.2, 1000, 30000);
    }
}