package com.gmao.backend.ai.chat.service;

import com.gmao.backend.ai.AiException;
import com.gmao.backend.ai.chat.dto.*;
import com.gmao.backend.ai.settings.service.AiSettingsService;
import com.gmao.backend.ai.settings.repository.AiModuleConfigRepository;
import com.gmao.backend.ai.settings.repository.AiSettingsRepository;
import com.gmao.backend.audit.entity.AuditLog;
import com.gmao.backend.audit.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AiServiceTest {

    @Autowired
    private AiService aiService;

    @Autowired
    private AiSettingsService aiSettingsService;

    @Autowired
    private AiSettingsRepository aiSettingsRepository;

    @Autowired
    private AiModuleConfigRepository aiModuleConfigRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @BeforeEach
    void cleanUp() {
        aiSettingsRepository.deleteAll();
        aiModuleConfigRepository.deleteAll();
        auditLogRepository.deleteAll();
    }

    @Test
    void chatWithMockProviderReturnsReplyAndUsage() {
        AiChatResponse response = aiService.chat("¿Cuántas órdenes de trabajo hay?");

        assertNotNull(response.reply());
        assertTrue(response.reply().contains("mock"));
        assertNotNull(response.usage());
        assertEquals(0, response.usage().estimatedCost());
    }

    @Test
    void chatWithEmptyMessageThrows() {
        assertThrows(AiException.class, () -> aiService.chat("   "));
    }

    @Test
    void suggestReturnsStructuredResponse() {
        AiSuggestResponse response = aiService.suggest(
            "Fuga de aceite en la bomba principal", "Bomba principal", null);

        assertNotNull(response.title());
        assertTrue(response.title().contains("Fuga"));
        assertEquals(3, response.priority());
        assertNotNull(response.estimatedHours());
        assertFalse(response.checklist().isEmpty());
    }

    @Test
    void suggestWithoutDescriptionThrows() {
        assertThrows(AiException.class, () -> aiService.suggest(null, null, null));
    }

    @Test
    void prioritizeReturnsSuggestions() {
        AiPrioritizeResponse response = aiService.prioritize(null);

        assertNotNull(response.suggestions());
        for (AiPrioritizeSuggestion suggestion : response.suggestions()) {
            assertNotNull(suggestion.workOrderId());
            assertTrue(suggestion.suggestedPriority() >= 1 && suggestion.suggestedPriority() <= 4);
            assertNotNull(suggestion.reason());
        }
    }

    @Test
    void summarizeReturnsSummary() {
        AiSummarizeResponse response = aiService.summarize("semanal", null, null);

        assertNotNull(response.summary());
        assertFalse(response.summary().isBlank());
    }

    @Test
    void disabledModuleThrows() {
        aiSettingsService.setEnabled(false);

        assertFalse(aiSettingsService.isEnabled());
        assertThrows(AiException.class, () -> aiService.chat("hola"));
    }

    @Test
    void aiCallsAreAudited() {
        aiService.chat("prueba de auditoría");

        List<AuditLog> logs = auditLogRepository.findAll();
        assertEquals(1, logs.size());
        AuditLog log = logs.get(0);
        assertEquals("AI", log.getCategory());
        assertEquals("CHAT", log.getAction());
        assertEquals("/api/ai/assistant/chat", log.getPath());
        assertTrue(log.getDetails().contains("provider=mock"));
        assertTrue(log.getDetails().contains("tokensIn="));
        assertTrue(log.getDetails().contains("cost="));
        assertNotNull(log.getLatencyMs());
    }
}