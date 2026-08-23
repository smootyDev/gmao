package com.gmao.backend.ai.provider;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AnthropicAdapterTest {

    private HttpServer server;
    private final List<String> requestLog = new ArrayList<>();
    private String lastRequestBody;
    private String apiKeyHeader;
    private String versionHeader;

    private void startServer() throws IOException {
        lastRequestBody = null;
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/v1/messages", exchange -> {
            requestLog.add(exchange.getRequestMethod() + " " + exchange.getRequestURI().getPath());
            apiKeyHeader = exchange.getRequestHeaders().getFirst("x-api-key");
            versionHeader = exchange.getRequestHeaders().getFirst("anthropic-version");
            lastRequestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            byte[] body = ("{\"content\":[{\"type\":\"text\",\"text\":\"Hola\"},"
                + "{\"type\":\"thinking\",\"thinking\":\"...\"},"
                + "{\"type\":\"text\",\"text\":\"mundo\"}],"
                + "\"usage\":{\"input_tokens\":5,\"output_tokens\":3}}").getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        });
        server.start();
    }

    @AfterEach
    void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void completeBuildsMessagesRequestAndParsesContent() throws IOException {
        startServer();
        AnthropicAdapter adapter = new AnthropicAdapter(new tools.jackson.databind.ObjectMapper());
        AiCallSettings settings = new AiCallSettings(AiProviderName.ANTHROPIC, "claude-haiku-4-5-20251001",
            "http://localhost:" + server.getAddress().getPort(), "sk-ant-123", null, 0.3, 512, 30000);

        AiCompletion completion = adapter.complete("Sistema", "Usuario", settings);

        assertThat(completion.text()).isEqualTo("Hola\nmundo");
        assertThat(completion.tokensIn()).isEqualTo(5);
        assertThat(completion.tokensOut()).isEqualTo(3);
        assertThat(requestLog).contains("POST /v1/messages");
        assertThat(apiKeyHeader).isEqualTo("sk-ant-123");
        assertThat(versionHeader).isEqualTo("2023-06-01");
        assertThat(lastRequestBody).contains("\"model\":\"claude-haiku-4-5-20251001\"");
        assertThat(lastRequestBody).contains("\"max_tokens\":512");
        assertThat(lastRequestBody).contains("\"temperature\":0.3");
        assertThat(lastRequestBody).contains("\"system\":\"Sistema\"");
        assertThat(lastRequestBody).contains("\"role\":\"user\"");
    }

    @Test
    void appendsMessagesPathWhenBaseUrlIsApiRoot() throws IOException {
        startServer();
        AnthropicAdapter adapter = new AnthropicAdapter(new tools.jackson.databind.ObjectMapper());
        AiCallSettings settings = new AiCallSettings(AiProviderName.ANTHROPIC, "claude-haiku-4-5-20251001",
            "http://localhost:" + server.getAddress().getPort() + "/v1", "sk-ant-123", null, null, null, 30000);

        adapter.complete("Sistema", "Usuario", settings);

        assertThat(requestLog).contains("POST /v1/messages");
    }

    @Test
    void defaultsMaxTokensWhenNull() throws IOException {
        startServer();
        AnthropicAdapter adapter = new AnthropicAdapter(new tools.jackson.databind.ObjectMapper());
        AiCallSettings settings = new AiCallSettings(AiProviderName.ANTHROPIC, "claude-haiku-4-5-20251001",
            "http://localhost:" + server.getAddress().getPort(), "sk-ant-123", null, null, null, 30000);

        adapter.complete("Sistema", "Usuario", settings);

        assertThat(lastRequestBody).contains("\"max_tokens\":1000");
    }

    @Test
    void throwsWhenBaseUrlMissing() {
        AnthropicAdapter adapter = new AnthropicAdapter(new tools.jackson.databind.ObjectMapper());
        AiCallSettings settings = new AiCallSettings(AiProviderName.ANTHROPIC, null, "", null, null,
            null, null, 30000);

        assertThatThrownBy(() -> adapter.complete("Sistema", "Usuario", settings))
            .isInstanceOf(AiProviderException.class)
            .hasMessageContaining("URL base");
    }
}