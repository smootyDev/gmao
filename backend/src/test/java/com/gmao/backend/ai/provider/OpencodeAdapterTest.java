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
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OpencodeAdapterTest {

    private HttpServer server;
    private final List<String> requestLog = new ArrayList<>();
    private String lastMessageBody;

    private void startServer() throws IOException {
        lastMessageBody = null;
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/session", exchange -> {
            requestLog.add(exchange.getRequestMethod() + " " + exchange.getRequestURI().getPath()
                + " auth=" + exchange.getRequestHeaders().getFirst("Authorization"));
            byte[] body = ("{\"id\":\"sess-123\"}").getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        });
        server.createContext("/session/sess-123/message", exchange -> {
            requestLog.add(exchange.getRequestMethod() + " " + exchange.getRequestURI().getPath());
            lastMessageBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            byte[] body = ("{\"info\":{\"tokens\":{\"input\":5,\"output\":3}},"
                + "\"parts\":[{\"type\":\"text\",\"text\":\"Hola\"},{\"type\":\"tool\",\"state\":\"completed\"},"
                + "{\"type\":\"text\",\"text\":\"mundo\"}]}").getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        });
        server.createContext("/session/sess-123", exchange -> {
            requestLog.add(exchange.getRequestMethod() + " " + exchange.getRequestURI().getPath());
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });
        server.createContext("/config/providers", exchange -> {
            requestLog.add(exchange.getRequestMethod() + " " + exchange.getRequestURI().getPath());
            byte[] body = ("{\"providers\":[{\"id\":\"opencode\","
                + "\"models\":{\"deepseek-v4-flash\":{\"id\":\"deepseek-v4-flash\"}}}],"
                + "\"default\":{\"opencode\":\"deepseek-v4-flash\"}}").getBytes(StandardCharsets.UTF_8);
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
    void completeCreatesSessionSendsMessageAndCleansUp() throws IOException {
        startServer();
        OpencodeAdapter adapter = new OpencodeAdapter(new tools.jackson.databind.ObjectMapper());
        AiCallSettings settings = new AiCallSettings(AiProviderName.OPENCODE, "opencode/gpt-4o",
            "http://localhost:" + server.getAddress().getPort(), "secret", "opencode", 0.2, 1000, 30000);

        AiCompletion completion = adapter.complete("Sistema", "Usuario", settings);

        assertThat(completion.text()).isEqualTo("Hola\nmundo");
        assertThat(completion.tokensIn()).isEqualTo(5);
        assertThat(completion.tokensOut()).isEqualTo(3);
        assertThat(requestLog).contains("POST /session auth=Basic b3BlbmNvZGU6c2VjcmV0");
        assertThat(requestLog).contains("POST /session/sess-123/message");
        assertThat(requestLog).contains("DELETE /session/sess-123");
        assertThat(lastMessageBody).contains("\"modelID\":\"gpt-4o\"");
        assertThat(lastMessageBody).contains("\"providerID\":\"opencode\"");
        assertThat(lastMessageBody).contains("\"system\":\"Sistema\"");
        assertThat(lastMessageBody).contains("\"type\":\"text\"");
    }

    @Test
    void resolvesProviderFromCatalogWhenModelHasNoPrefix() throws IOException {
        startServer();
        OpencodeAdapter adapter = new OpencodeAdapter(new tools.jackson.databind.ObjectMapper());
        AiCallSettings settings = new AiCallSettings(AiProviderName.OPENCODE, "deepseek-v4-flash",
            "http://localhost:" + server.getAddress().getPort(), "pw", "opencode", null, null, 30000);

        adapter.complete("Sistema", "Usuario", settings);

        assertThat(requestLog).contains("GET /config/providers");
        assertThat(lastMessageBody).contains("\"modelID\":\"deepseek-v4-flash\"");
        assertThat(lastMessageBody).contains("\"providerID\":\"opencode\"");
    }

    @Test
    void throwsWhenModelCannotBeResolved() throws IOException {
        startServer();
        OpencodeAdapter adapter = new OpencodeAdapter(new tools.jackson.databind.ObjectMapper());
        AiCallSettings settings = new AiCallSettings(AiProviderName.OPENCODE, "modelo-inexistente",
            "http://localhost:" + server.getAddress().getPort(), "pw", "opencode", null, null, 30000);

        assertThatThrownBy(() -> adapter.complete("Sistema", "Usuario", settings))
            .isInstanceOf(AiProviderException.class)
            .hasMessageContaining("proveedor/modelo");
    }

    @Test
    void omitsModelWhenBlank() throws IOException {
        startServer();
        OpencodeAdapter adapter = new OpencodeAdapter(new tools.jackson.databind.ObjectMapper());
        AiCallSettings settings = new AiCallSettings(AiProviderName.OPENCODE, "   ",
            "http://localhost:" + server.getAddress().getPort(), "pw", "opencode", null, null, 30000);

        adapter.complete("Sistema", "Usuario", settings);

        assertThat(lastMessageBody).doesNotContain("\"model\"");
    }

    @Test
    void usesDefaultUsernameWhenMissing() throws IOException {
        startServer();
        OpencodeAdapter adapter = new OpencodeAdapter(new tools.jackson.databind.ObjectMapper());
        AiCallSettings settings = new AiCallSettings(AiProviderName.OPENCODE, null,
            "http://localhost:" + server.getAddress().getPort(), "pw", null, null, null, 30000);

        adapter.complete("Sistema", "Usuario", settings);

        assertThat(requestLog.get(0)).endsWith("auth=Basic b3BlbmNvZGU6cHc=");
    }

    @Test
    void throwsWhenBaseUrlMissing() {
        OpencodeAdapter adapter = new OpencodeAdapter(new tools.jackson.databind.ObjectMapper());
        AiCallSettings settings = new AiCallSettings(AiProviderName.OPENCODE, null, "", null, null,
            null, null, 30000);

        assertThatThrownBy(() -> adapter.complete("Sistema", "Usuario", settings))
            .isInstanceOf(AiProviderException.class)
            .hasMessageContaining("URL base");
    }
}