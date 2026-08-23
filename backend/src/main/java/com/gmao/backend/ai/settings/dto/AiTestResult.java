package com.gmao.backend.ai.settings.dto;

public record AiTestResult(
    boolean ok,
    String provider,
    String model,
    long latencyMs,
    String message
) {
}