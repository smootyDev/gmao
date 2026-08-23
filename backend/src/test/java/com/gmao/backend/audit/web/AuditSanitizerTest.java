package com.gmao.backend.audit.web;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuditSanitizerTest {

    private final AuditSanitizer sanitizer = new AuditSanitizer(new ObjectMapper());

    @Test
    void redactsSensitiveFieldsTopLevel() {
        String json = "{\"title\":\"Orden\",\"password\":\"secreto\",\"apiKey\":\"sk-abc\"}";

        String result = sanitizer.sanitize(json);

        assertTrue(result.contains("\"title\":\"Orden\""));
        assertTrue(result.contains("\"password\":\"[REDACTED]\""));
        assertTrue(result.contains("\"apiKey\":\"[REDACTED]\""));
        assertFalse(result.contains("secreto"));
        assertFalse(result.contains("sk-abc"));
    }

    @Test
    void redactsNestedSensitiveFields() {
        String json = "{\"user\":{\"username\":\"admin\",\"clientId\":\"uuid-1\",\"token\":\"abc\"}}";

        String result = sanitizer.sanitize(json);

        assertTrue(result.contains("\"username\":\"admin\""));
        assertTrue(result.contains("\"clientId\":\"[REDACTED]\""));
        assertTrue(result.contains("\"token\":\"[REDACTED]\""));
        assertFalse(result.contains("uuid-1"));
        assertFalse(result.contains("\"token\":\"abc\""));
    }

    @Test
    void redactsInsideArrays() {
        String json = "{\"items\":[{\"code\":\"A1\",\"password\":\"x\"},{\"code\":\"A2\"}]}";

        String result = sanitizer.sanitize(json);

        assertTrue(result.contains("\"code\":\"A1\""));
        assertTrue(result.contains("\"password\":\"[REDACTED]\""));
        assertTrue(result.contains("\"code\":\"A2\""));
    }

    @Test
    void unparseableBodyReturnsMarker() {
        String result = sanitizer.sanitize("not json{{{");

        assertEquals("[contenido no parseable]", result);
    }

    @Test
    void nullOrBlankReturnsNull() {
        assertNull(sanitizer.sanitize(null));
        assertNull(sanitizer.sanitize("   "));
    }
}