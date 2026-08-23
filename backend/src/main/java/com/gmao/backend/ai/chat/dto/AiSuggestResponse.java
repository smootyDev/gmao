package com.gmao.backend.ai.chat.dto;

import java.util.List;

public record AiSuggestResponse(
    String title,
    String description,
    Integer priority,
    Double estimatedHours,
    List<String> checklist
) {
}