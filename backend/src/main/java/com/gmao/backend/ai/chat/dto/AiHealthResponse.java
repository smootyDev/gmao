package com.gmao.backend.ai.chat.dto;

public record AiHealthResponse(
    boolean enabled,
    String provider,
    String model,
    String status
) {
}