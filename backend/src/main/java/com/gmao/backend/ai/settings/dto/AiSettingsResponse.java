package com.gmao.backend.ai.settings.dto;

import java.util.List;

public record AiSettingsResponse(
    boolean enabled,
    String activeProvider,
    List<AiProviderSettings> providers
) {
}