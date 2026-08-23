package com.gmao.backend.ai.provider;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AiProviderFactory {

    private final MockAiAdapter mockAiAdapter;
    private final OpenAiAdapter openAiAdapter;
    private final OpencodeAdapter opencodeAdapter;
    private final AnthropicAdapter anthropicAdapter;

    public AiProviderFactory(MockAiAdapter mockAiAdapter, OpenAiAdapter openAiAdapter,
                             OpencodeAdapter opencodeAdapter, AnthropicAdapter anthropicAdapter) {
        this.mockAiAdapter = mockAiAdapter;
        this.openAiAdapter = openAiAdapter;
        this.opencodeAdapter = opencodeAdapter;
        this.anthropicAdapter = anthropicAdapter;
    }

    public AiProvider adapterFor(AiProviderName provider) {
        return switch (provider) {
            case MOCK -> mockAiAdapter;
            case OPENAI, AZURE, OLLAMA, GOOGLE -> openAiAdapter;
            case OPENCODE -> opencodeAdapter;
            case ANTHROPIC -> anthropicAdapter;
        };
    }

    public List<String> supportedProviders() {
        return List.of("openai", "azure", "ollama", "opencode", "anthropic", "google", "mock");
    }
}