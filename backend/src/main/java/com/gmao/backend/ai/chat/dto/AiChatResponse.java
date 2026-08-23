package com.gmao.backend.ai.chat.dto;

public record AiChatResponse(
    String reply,
    AiUsage usage
) {
}