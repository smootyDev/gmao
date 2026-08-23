package com.gmao.backend.ai.chat.dto;

import java.util.List;

public record AiPrioritizeRequest(
    List<Long> workOrderIds
) {
}