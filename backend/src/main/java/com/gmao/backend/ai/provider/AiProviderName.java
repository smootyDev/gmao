package com.gmao.backend.ai.provider;

public enum AiProviderName {
    OPENAI,
    AZURE,
    ANTHROPIC,
    GOOGLE,
    OLLAMA,
    OPENCODE,
    MOCK;

    public static AiProviderName from(String value) {
        if (value == null || value.isBlank()) {
            return MOCK;
        }
        try {
            return AiProviderName.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return MOCK;
        }
    }
}