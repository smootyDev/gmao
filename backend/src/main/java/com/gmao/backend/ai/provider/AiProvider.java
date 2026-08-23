package com.gmao.backend.ai.provider;

public interface AiProvider {

    String name();

    AiCompletion complete(String systemPrompt, String userPrompt, AiCallSettings settings);
}