package com.gmao.backend.ai.chat.dto;

import java.time.Instant;

public record AiSummarizeRequest(
    String scope,
    Instant from,
    Instant to
) {
}