package com.gmao.backend.ai.chat.dto;

public record AiSuggestRequest(
    String description,
    String assetName,
    String notes
) {
}