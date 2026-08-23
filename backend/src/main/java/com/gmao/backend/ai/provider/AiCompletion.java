package com.gmao.backend.ai.provider;

public record AiCompletion(
    String text,
    long tokensIn,
    long tokensOut
) {
}