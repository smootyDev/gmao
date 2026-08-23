package com.gmao.backend.audit.web;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Set;

@Component
public class AuditSanitizer {

    private static final Set<String> SENSITIVE_FIELDS = Set.of(
        "password", "apikey", "api_key", "authorization", "token",
        "accesstoken", "access_token", "secret", "secretkey", "secret_key",
        "clientid", "client_id", "cardnumber", "cvv"
    );

    private final ObjectMapper objectMapper;

    public AuditSanitizer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String sanitize(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode redacted = redact(root);
            return objectMapper.writeValueAsString(redacted);
        } catch (Exception e) {
            return "[contenido no parseable]";
        }
    }

    private JsonNode redact(JsonNode node) {
        if (node == null) {
            return null;
        }
        if (node.isObject()) {
            ObjectNode objectNode = (ObjectNode) node;
            objectNode.properties().forEach(entry -> {
                String fieldName = entry.getKey();
                JsonNode value = entry.getValue();
                if (SENSITIVE_FIELDS.contains(fieldName.toLowerCase(Locale.ROOT))) {
                    objectNode.put(fieldName, "[REDACTED]");
                } else if (value != null && (value.isObject() || value.isArray())) {
                    objectNode.set(fieldName, redact(value));
                }
            });
            return objectNode;
        }
        if (node.isArray()) {
            ArrayNode arrayNode = (ArrayNode) node;
            for (int i = 0; i < arrayNode.size(); i++) {
                arrayNode.set(i, redact(arrayNode.get(i)));
            }
            return arrayNode;
        }
        return node;
    }
}