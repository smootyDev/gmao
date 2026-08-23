package com.gmao.backend.ai.chat.dto;

import java.util.List;

public record AiPrioritizeResponse(
    List<AiPrioritizeSuggestion> suggestions
) {
}