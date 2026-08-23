package com.gmao.backend.ai.chat.dto;

public record AiUsage(
    long tokensIn,
    long tokensOut,
    long latencyMs,
    double estimatedCost
) {
}