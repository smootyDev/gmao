package com.gmao.backend.ai.chat.dto;

public record AiPrioritizeSuggestion(
    Long workOrderId,
    Integer suggestedPriority,
    String reason
) {
}