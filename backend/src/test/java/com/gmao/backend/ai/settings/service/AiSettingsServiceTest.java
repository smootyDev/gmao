package com.gmao.backend.ai.settings.service;

import com.gmao.backend.ai.settings.dto.AiProviderSettings;
import com.gmao.backend.ai.settings.dto.AiSettingsRequest;
import com.gmao.backend.ai.settings.dto.AiSettingsResponse;
import com.gmao.backend.ai.settings.dto.AiTestResult;
import com.gmao.backend.ai.settings.entity.AiSettings;
import com.gmao.backend.ai.provider.AiCallSettings;
import com.gmao.backend.ai.settings.repository.AiModuleConfigRepository;
import com.gmao.backend.ai.settings.repository.AiSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AiSettingsServiceTest {

    @Autowired
    private AiSettingsService aiSettingsService;

    @Autowired
    private AiSettingsRepository aiSettingsRepository;

    @Autowired
    private AiModuleConfigRepository aiModuleConfigRepository;

    @BeforeEach
    void cleanUp() {
        aiSettingsRepository.deleteAll();
        aiModuleConfigRepository.deleteAll();
    }

    @Test
    void defaultSettingsComeFromEnvWhenNoStoredRow() {
        assertTrue(aiSettingsService.isEnabled());
        AiSettingsResponse response = aiSettingsService.getSettings();
        assertEquals("mock", response.activeProvider());
        assertTrue(response.providers().isEmpty());
    }

    @Test
    void updateStoresProviderConfigEncryptsApiKeyAndActivatesFirst() {
        aiSettingsService.updateSettings(new AiSettingsRequest(
            "openai", "gpt-4o-mini", "https://api.openai.com/v1", null,
            "sk-test-secret-123", 0.2, 800, 15000L));

        AiSettingsResponse response = aiSettingsService.getSettings();
        assertEquals(1, response.providers().size());
        AiProviderSettings provider = response.providers().get(0);
        assertEquals("openai", provider.provider());
        assertTrue(provider.apiKeyConfigured());
        assertEquals("openai", response.activeProvider());

        AiSettings stored = aiSettingsRepository.findByProvider("openai").orElseThrow();
        assertTrue(stored.getIsActive());
        assertNotNull(stored.getApiKeyCipher());
        assertFalse(stored.getApiKeyCipher().contains("sk-test-secret-123"));

        AiCallSettings effective = aiSettingsService.getEffectiveSettings();
        assertEquals("openai", effective.provider().name().toLowerCase());
        assertEquals("gpt-4o-mini", effective.model());
        assertEquals("sk-test-secret-123", effective.apiKey());
        assertEquals(15000L, effective.timeoutMs());
    }

    @Test
    void updateWithoutApiKeyKeepsExistingCipher() {
        aiSettingsService.updateSettings(new AiSettingsRequest(
            "openai", "gpt-4o-mini", null, null, "sk-first", null, null, null));
        String cipherBefore = aiSettingsRepository.findByProvider("openai").orElseThrow().getApiKeyCipher();

        aiSettingsService.updateSettings(new AiSettingsRequest(
            "openai", "gpt-4o-mini", null, null, "", null, null, null));

        String cipherAfter = aiSettingsRepository.findByProvider("openai").orElseThrow().getApiKeyCipher();
        assertEquals(cipherBefore, cipherAfter);
        assertEquals("sk-first", aiSettingsService.getEffectiveSettings().apiKey());
    }

    @Test
    void usernameIsOnlyPersistedForOpencodeProvider() {
        aiSettingsService.updateSettings(new AiSettingsRequest(
            "openai", "gpt-4o-mini", null, "usuario-no-opencode",
            "secret", null, null, null));
        assertNull(aiSettingsRepository.findByProvider("openai").orElseThrow().getUsername());

        aiSettingsRepository.deleteAll();
        aiSettingsService.updateSettings(new AiSettingsRequest(
            "opencode", null, "http://localhost:4096", "opencode-user",
            "secret", null, null, null));
        assertEquals("opencode-user",
            aiSettingsRepository.findByProvider("opencode").orElseThrow().getUsername());
    }

    @Test
    void storesSeveralProvidersAndOnlyOneIsActive() {
        aiSettingsService.updateSettings(new AiSettingsRequest(
            "openai", "gpt-4o-mini", "https://api.openai.com/v1", null, "key-1", null, null, null));
        aiSettingsService.updateSettings(new AiSettingsRequest(
            "anthropic", "claude-haiku-4-5-20251001", "https://api.anthropic.com/v1", null, "key-2", null, null, null));

        AiSettingsResponse response = aiSettingsService.getSettings();
        assertEquals(2, response.providers().size());
        assertEquals("openai", response.activeProvider());
        assertEquals(1, response.providers().stream().filter(AiProviderSettings::isActive).count());
    }

    @Test
    void activateSwitchesActiveProvider() {
        aiSettingsService.updateSettings(new AiSettingsRequest(
            "openai", "gpt-4o-mini", "https://api.openai.com/v1", null, "key-1", null, null, null));
        aiSettingsService.updateSettings(new AiSettingsRequest(
            "anthropic", "claude-haiku-4-5-20251001", "https://api.anthropic.com/v1", null, "key-2", null, null, null));

        aiSettingsService.activate("anthropic");

        AiSettingsResponse response = aiSettingsService.getSettings();
        assertEquals("anthropic", response.activeProvider());
        assertEquals(1, response.providers().stream().filter(AiProviderSettings::isActive).count());
        assertEquals("anthropic", aiSettingsService.getEffectiveSettings().provider().name().toLowerCase());
        assertEquals("key-2", aiSettingsService.getEffectiveSettings().apiKey());
    }

    @Test
    void activateWithoutStoredConfigCreatesMinimalRow() {
        aiSettingsService.activate("google");

        AiSettingsResponse response = aiSettingsService.getSettings();
        assertEquals("google", response.activeProvider());
        assertEquals(1, response.providers().size());
        assertTrue(aiSettingsRepository.findByProvider("google").orElseThrow().getIsActive());
    }

    @Test
    void testConnectionMockReturnsOk() {
        AiTestResult result = aiSettingsService.testConnection("mock");
        assertTrue(result.ok());
        assertEquals("mock", result.provider());
    }

    @Test
    void testConnectionUnknownProviderReturnsFailure() {
        AiTestResult result = aiSettingsService.testConnection("no-existe");
        assertFalse(result.ok());
        assertTrue(result.message().contains("no válido"));
    }

    @Test
    void setEnabledPersistsGlobalFlag() {
        aiSettingsService.setEnabled(false);
        assertFalse(aiSettingsService.isEnabled());
        aiSettingsService.setEnabled(true);
        assertTrue(aiSettingsService.isEnabled());
    }
}