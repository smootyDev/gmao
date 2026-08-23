package com.gmao.backend.ai.provider;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class OpencodeAdapter implements AiProvider {

    private static final Logger log = LoggerFactory.getLogger(OpencodeAdapter.class);

    private final ObjectMapper objectMapper;

    public OpencodeAdapter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "opencode";
    }

    @Override
    public AiCompletion complete(String systemPrompt, String userPrompt, AiCallSettings settings) {
        String baseUrl = settings.baseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new AiProviderException("Falta la URL base del proveedor opencode");
        }
        String normalized = baseUrl.replaceAll("/+$", "");
        RestClient restClient = buildRestClient(settings.timeoutMs());

        String sessionId;
        try {
            sessionId = createSession(restClient, normalized, settings);
            log.info("opencode: sesión creada [{}] en {}", sessionId, normalized);
        } catch (AiProviderException e) {
            log.error("opencode: no se pudo crear la sesión en {} -> {}", normalized, e.getMessage());
            throw e;
        }

        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("parts", java.util.List.of(
                Map.of("type", "text", "text", userPrompt == null ? "" : userPrompt)));
            if (systemPrompt != null && !systemPrompt.isBlank()) {
                body.put("system", systemPrompt);
            }
            if (settings.model() != null && !settings.model().isBlank()) {
                Map<String, String> modelRef = resolveModel(restClient, normalized, settings);
                log.info("opencode: modelo '{}' resuelto como providerID={}, modelID={}",
                    settings.model(), modelRef.get("providerID"), modelRef.get("modelID"));
                body.put("model", modelRef);
            }

            long start = System.nanoTime();
            JsonNode response;
            try {
                response = restClient.post()
                    .uri(normalized + "/session/" + sessionId + "/message")
                    .headers(headers -> applyAuth(headers, settings))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            } catch (Exception e) {
                long latencyMs = (System.nanoTime() - start) / 1_000_000;
                log.error("opencode: el servidor rechazó el mensaje (sesión {}, modelo {}, {} ms) en {} -> {}",
                    sessionId, settings.model(), latencyMs, normalized, rootMessage(e), e);
                throw new AiProviderException("El servidor opencode rechazó el mensaje: " + rootMessage(e));
            }

            AiCompletion completion = parse(response);
            log.info("opencode: respuesta OK (sesión {}, tokensIn={}, tokensOut={})",
                sessionId, completion.tokensIn(), completion.tokensOut());
            return completion;
        } finally {
            try {
                restClient.delete()
                    .uri(normalized + "/session/" + sessionId)
                    .headers(headers -> applyAuth(headers, settings))
                    .retrieve()
                    .toBodilessEntity();
            } catch (Exception e) {
                log.warn("opencode: no se pudo eliminar la sesión {} en {} -> {}",
                    sessionId, normalized, rootMessage(e));
            }
        }
    }

    private String createSession(RestClient restClient, String baseUrl, AiCallSettings settings) {
        try {
            JsonNode session = restClient.post()
                .uri(baseUrl + "/session")
                .headers(headers -> applyAuth(headers, settings))
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of())
                .retrieve()
                .body(JsonNode.class);
            if (session == null) {
                throw new AiProviderException("El servidor opencode no devolvió una sesión");
            }
            String id = session.path("id").asText("");
            if (id.isBlank()) {
                throw new AiProviderException("El servidor opencode no devolvió un id de sesión");
            }
            return id;
        } catch (AiProviderException e) {
            throw e;
        } catch (Exception e) {
            throw new AiProviderException("No se pudo crear una sesión en opencode: " + rootMessage(e));
        }
    }

    private Map<String, String> resolveModel(RestClient restClient, String baseUrl, AiCallSettings settings) {
        String model = settings.model().trim();
        int slash = model.indexOf('/');
        if (slash > 0) {
            return Map.of("providerID", model.substring(0, slash), "modelID", model.substring(slash + 1));
        }
        try {
            JsonNode config = restClient.get()
                .uri(baseUrl + "/config/providers")
                .headers(headers -> applyAuth(headers, settings))
                .retrieve()
                .body(JsonNode.class);
            if (config != null) {
                JsonNode providers = config.path("providers");
                if (providers.isArray()) {
                    for (JsonNode provider : providers) {
                        String providerId = provider.path("id").asText("");
                        if (providerId.isBlank()) {
                            continue;
                        }
                        JsonNode models = provider.path("models");
                        if (models instanceof ObjectNode modelsNode) {
                            for (Map.Entry<String, JsonNode> entry : modelsNode.properties()) {
                                String key = entry.getKey();
                                String candidateId = entry.getValue().path("id").asText(key);
                                if (model.equals(key) || model.equals(candidateId)) {
                                    return Map.of("providerID", providerId, "modelID", candidateId);
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("opencode: no se pudo consultar el catálogo de modelos en {}/config/providers -> {}",
                baseUrl, rootMessage(e));
        }
        throw new AiProviderException("No se pudo resolver el modelo '" + model + "' en el servidor opencode. "
            + "Usa el formato proveedor/modelo (p.ej. opencode/deepseek-v4-flash)");
    }

    private void applyAuth(HttpHeaders headers, AiCallSettings settings) {
        String username = settings.username() == null || settings.username().isBlank()
            ? "opencode" : settings.username();
        String password = settings.apiKey() == null ? "" : settings.apiKey();
        String credentials = Base64.getEncoder().encodeToString(
            (username + ":" + password).getBytes(StandardCharsets.UTF_8));
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + credentials);
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
            throw new AiProviderException("Respuesta vacía del servidor opencode");
        }
        StringBuilder text = new StringBuilder();
        JsonNode parts = response.path("parts");
        if (parts.isArray()) {
            for (JsonNode part : parts) {
                if ("text".equals(part.path("type").asText(""))) {
                    String chunk = part.path("text").asText("");
                    if (!chunk.isBlank()) {
                        if (!text.isEmpty()) {
                            text.append("\n");
                        }
                        text.append(chunk);
                    }
                }
            }
        }
        if (text.isEmpty()) {
            throw new AiProviderException("El servidor opencode no devolvió contenido de texto");
        }
        JsonNode tokens = response.path("info").path("tokens");
        long tokensIn = tokens.path("input").asLong(0);
        long tokensOut = tokens.path("output").asLong(0);
        return new AiCompletion(text.toString(), tokensIn, tokensOut);
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