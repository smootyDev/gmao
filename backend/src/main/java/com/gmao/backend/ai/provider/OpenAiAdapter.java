package com.gmao.backend.ai.provider;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class OpenAiAdapter implements AiProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenAiAdapter.class);

    private final ObjectMapper objectMapper;

    public OpenAiAdapter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "openai";
    }

    @Override
    public AiCompletion complete(String systemPrompt, String userPrompt, AiCallSettings settings) {
        String endpoint = buildEndpoint(settings);

        Map<String, Object> body = new LinkedHashMap<>();
        if (settings.model() != null && !settings.model().isBlank()) {
            body.put("model", settings.model());
        }
        body.put("messages", List.of(
            Map.of("role", "system", "content", systemPrompt == null ? "" : systemPrompt),
            Map.of("role", "user", "content", userPrompt == null ? "" : userPrompt)
        ));
        if (settings.temperature() != null) {
            body.put("temperature", settings.temperature());
        }
        if (settings.maxTokens() != null) {
            body.put("max_tokens", settings.maxTokens());
        }

        RestClient restClient = buildRestClient(settings.timeoutMs());
        long start = System.nanoTime();
        JsonNode response;
        try {
            response = restClient.post()
                .uri(endpoint)
                .headers(headers -> applyAuth(headers, settings))
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);
        } catch (Exception e) {
            long latencyMs = (System.nanoTime() - start) / 1_000_000;
            log.error("{}: error al llamar a {} (modelo {}, {} ms) -> {}",
                name(), endpoint, settings.model(), latencyMs, rootMessage(e), e);
            throw new AiProviderException("El proveedor " + name() + " rechazó la petición: " + rootMessage(e));
        }

        AiCompletion completion = parse(response);
        log.info("{}: respuesta OK desde {} (modelo {}, tokensIn={}, tokensOut={}, {} ms)",
            name(), endpoint, settings.model(), completion.tokensIn(), completion.tokensOut(),
            (System.nanoTime() - start) / 1_000_000);
        return completion;
    }

    private String buildEndpoint(AiCallSettings settings) {
        String baseUrl = settings.baseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new AiProviderException("Falta la URL base del proveedor " + name());
        }
        if (settings.provider() == AiProviderName.OLLAMA && !baseUrl.contains("/v1")) {
            baseUrl = baseUrl.replaceAll("/+$", "") + "/v1";
        }
        return baseUrl.replaceAll("/+$", "") + "/chat/completions";
    }

    private void applyAuth(HttpHeaders headers, AiCallSettings settings) {
        if (settings.provider() == AiProviderName.AZURE) {
            if (settings.apiKey() != null && !settings.apiKey().isBlank()) {
                headers.set("api-key", settings.apiKey());
            }
        } else if (settings.apiKey() != null && !settings.apiKey().isBlank()) {
            headers.setBearerAuth(settings.apiKey());
        }
    }

    private RestClient buildRestClient(long timeoutMs) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(Math.max(1000, timeoutMs)));
        requestFactory.setReadTimeout(Duration.ofMillis(Math.max(1000, timeoutMs)));
        return RestClient.builder()
            .requestFactory(requestFactory)
            .build();
    }

    private AiCompletion parse(JsonNode response) {
        if (response == null) {
            throw new AiProviderException("Respuesta vacía del proveedor IA");
        }
        String text = response.path("choices").path(0).path("message").path("content").asText("");
        if (text.isBlank()) {
            throw new AiProviderException("El proveedor IA no devolvió contenido");
        }
        long tokensIn = response.path("usage").path("prompt_tokens").asLong(0);
        long tokensOut = response.path("usage").path("completion_tokens").asLong(0);
        return new AiCompletion(text, tokensIn, tokensOut);
    }

    private String rootMessage(Exception e) {
        Throwable cause = e;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        String message = cause.getMessage();
        return message == null ? cause.getClass().getSimpleName() : message;
    }
}