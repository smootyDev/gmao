package com.gmao.backend.ai.provider;

import org.springframework.stereotype.Component;

@Component
public class MockAiAdapter implements AiProvider {

    @Override
    public String name() {
        return "mock";
    }

    @Override
    public AiCompletion complete(String systemPrompt, String userPrompt, AiCallSettings settings) {
        String reply = "Respuesta simulada del asistente IA (proveedor 'mock'). "
            + "Recibido: " + truncate(userPrompt, 120);
        return new AiCompletion(reply, estimateTokens(systemPrompt) + estimateTokens(userPrompt),
            estimateTokens(reply));
    }

    private long estimateTokens(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return Math.max(1, text.split("\\s+").length / 2);
    }

    private String truncate(String text, int max) {
        if (text == null) {
            return "";
        }
        return text.length() <= max ? text : text.substring(0, max);
    }
}