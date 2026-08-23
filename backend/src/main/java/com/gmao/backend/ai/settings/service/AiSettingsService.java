package com.gmao.backend.ai.settings.service;

import com.gmao.backend.ai.settings.config.AiProperties;
import com.gmao.backend.ai.settings.dto.AiProviderSettings;
import com.gmao.backend.ai.settings.dto.AiSettingsRequest;
import com.gmao.backend.ai.settings.dto.AiSettingsResponse;
import com.gmao.backend.ai.settings.dto.AiTestResult;
import com.gmao.backend.ai.settings.entity.AiModuleConfig;
import com.gmao.backend.ai.settings.entity.AiSettings;
import com.gmao.backend.ai.provider.*;
import com.gmao.backend.ai.settings.repository.AiModuleConfigRepository;
import com.gmao.backend.ai.settings.repository.AiSettingsRepository;
import com.gmao.backend.audit.entity.AuditLog;
import com.gmao.backend.audit.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AiSettingsService {

    private static final Logger log = LoggerFactory.getLogger(AiSettingsService.class);

    private final AiSettingsRepository aiSettingsRepository;
    private final AiModuleConfigRepository aiModuleConfigRepository;
    private final AiProperties aiProperties;
    private final CryptoService cryptoService;
    private final AiProviderFactory providerFactory;
    private final AuditLogService auditLogService;

    public AiSettingsService(AiSettingsRepository aiSettingsRepository,
                             AiModuleConfigRepository aiModuleConfigRepository,
                             AiProperties aiProperties,
                             CryptoService cryptoService,
                             AiProviderFactory providerFactory,
                             AuditLogService auditLogService) {
        this.aiSettingsRepository = aiSettingsRepository;
        this.aiModuleConfigRepository = aiModuleConfigRepository;
        this.aiProperties = aiProperties;
        this.cryptoService = cryptoService;
        this.providerFactory = providerFactory;
        this.auditLogService = auditLogService;
    }

    public boolean isEnabled() {
        return aiModuleConfigRepository.findById(1L).map(AiModuleConfig::getEnabled)
            .orElse(aiProperties.isEnabled());
    }

    @Transactional
    public AiSettingsResponse setEnabled(boolean enabled) {
        AiModuleConfig cfg = aiModuleConfigRepository.findById(1L).orElseGet(AiModuleConfig::new);
        cfg.setId(1L);
        cfg.setEnabled(enabled);
        cfg.setUpdatedBy(currentUsername());
        aiModuleConfigRepository.save(cfg);

        auditLogService.record(AuditLog.builder()
            .category("CONFIG")
            .action("CONFIG_UPDATE")
            .username(currentUsername())
            .role(currentRole())
            .entity("ai_module_config")
            .path("/api/ai/settings/enabled")
            .method("PUT")
            .details("Módulo IA " + (enabled ? "habilitado" : "deshabilitado"))
            .build());

        return getSettings();
    }

    public AiProviderName effectiveProvider() {
        return aiSettingsRepository.findByIsActiveTrue()
            .map(s -> AiProviderName.from(s.getProvider()))
            .orElse(AiProviderName.from(aiProperties.getProvider()));
    }

    public AiCallSettings getEffectiveSettings() {
        Optional<AiSettings> active = aiSettingsRepository.findByIsActiveTrue();
        if (active.isEmpty()) {
            return new AiCallSettings(
                AiProviderName.from(aiProperties.getProvider()),
                aiProperties.getModel(), aiProperties.getBaseUrl(), aiProperties.getApiKey(), null,
                aiProperties.getTemperature(), aiProperties.getMaxTokens(), aiProperties.getTimeoutMs());
        }
        AiSettings s = active.get();
        return new AiCallSettings(
            AiProviderName.from(s.getProvider()), s.getModel(), s.getBaseUrl(),
            decryptKey(s), s.getUsername(), s.getTemperature(), s.getMaxTokens(), s.getTimeoutMs());
    }

    public AiSettingsResponse getSettings() {
        boolean enabled = isEnabled();
        String activeProvider = effectiveProvider().name().toLowerCase();
        List<AiProviderSettings> providers = aiSettingsRepository.findAll().stream()
            .map(this::toProviderSettings)
            .toList();
        return new AiSettingsResponse(enabled, activeProvider, providers);
    }

    @Transactional
    public AiSettingsResponse updateSettings(AiSettingsRequest request) {
        AiProviderName provider = requireProvider(request.provider());

        AiSettings stored = aiSettingsRepository.findByProvider(provider.name().toLowerCase())
            .orElseGet(() -> AiSettings.builder().provider(provider.name().toLowerCase()).build());

        stored.setModel(blankToNull(request.model()));
        stored.setBaseUrl(blankToNull(request.baseUrl()));
        stored.setUsername(provider == AiProviderName.OPENCODE ? blankToNull(request.username()) : null);
        stored.setTemperature(request.temperature());
        stored.setMaxTokens(request.maxTokens());
        stored.setTimeoutMs(request.timeoutMs() == null ? 30000L : request.timeoutMs());

        if (request.apiKey() != null && !request.apiKey().isBlank()) {
            String encrypted = cryptoService.encrypt(request.apiKey());
            String[] parts = encrypted.split(":", 2);
            stored.setApiKeyCipher(parts[1]);
            stored.setApiKeyIv(parts[0]);
        }

        if (!Boolean.TRUE.equals(stored.getIsActive())
            && aiSettingsRepository.findByIsActiveTrue().isEmpty()) {
            stored.setIsActive(true);
        }

        String currentUser = currentUsername();
        stored.setUpdatedBy(currentUser);
        aiSettingsRepository.save(stored);

        auditLogService.record(AuditLog.builder()
            .category("CONFIG")
            .action("CONFIG_UPDATE")
            .username(currentUser)
            .role(currentRole())
            .entity("ai_settings")
            .path("/api/ai/settings")
            .method("PUT")
            .details("Proveedor IA configurado: " + provider.name().toLowerCase()
                + (Boolean.TRUE.equals(stored.getIsActive()) ? ", activo" : ""))
            .build());

        return getSettings();
    }

    @Transactional
    public AiSettingsResponse activate(String providerStr) {
        AiProviderName provider = requireProvider(providerStr);

        AiSettings row = aiSettingsRepository.findByProvider(provider.name().toLowerCase())
            .orElseGet(() -> AiSettings.builder()
                .provider(provider.name().toLowerCase())
                .temperature(aiProperties.getTemperature())
                .maxTokens(aiProperties.getMaxTokens())
                .timeoutMs(aiProperties.getTimeoutMs())
                .build());
        if (row.getId() == null) {
            aiSettingsRepository.save(row);
        }

        aiSettingsRepository.deactivateAll();
        row.setIsActive(true);
        row.setUpdatedBy(currentUsername());
        aiSettingsRepository.save(row);

        auditLogService.record(AuditLog.builder()
            .category("CONFIG")
            .action("CONFIG_UPDATE")
            .username(currentUsername())
            .role(currentRole())
            .entity("ai_settings")
            .path("/api/ai/settings/" + provider.name().toLowerCase() + "/activate")
            .method("POST")
            .details("Proveedor IA activo: " + provider.name().toLowerCase())
            .build());

        log.info("IA: proveedor activo cambiado a {}", provider.name().toLowerCase());
        return getSettings();
    }

    public AiTestResult testConnection(String providerStr) {
        AiProviderName provider;
        try {
            provider = requireProvider(providerStr);
        } catch (IllegalArgumentException e) {
            return new AiTestResult(false, providerStr == null ? "-" : providerStr, "-", 0, e.getMessage());
        }

        AiCallSettings settings = settingsFor(provider);
        String model = settings.model() == null ? "-" : settings.model();
        long start = System.nanoTime();
        try {
            AiProvider adapter = providerFactory.adapterFor(settings.provider());
            AiCompletion completion = adapter.complete(
                "Eres un asistente de prueba del sistema GMAO.",
                "Responde exactamente con: OK",
                settings);
            long latencyMs = (System.nanoTime() - start) / 1_000_000;
            log.info("IA: prueba de conexión OK (provider={}, model={}, tokensIn={}, tokensOut={}, {} ms)",
                provider.name().toLowerCase(), model, completion.tokensIn(), completion.tokensOut(), latencyMs);
            auditLogService.record(AuditLog.builder()
                .category("AI")
                .action("TEST")
                .username(currentUsername())
                .role(currentRole())
                .entity("ai_settings")
                .path("/api/ai/settings/" + provider.name().toLowerCase() + "/test")
                .method("POST")
                .details("Prueba de conexión OK: provider=" + provider.name().toLowerCase()
                    + ", model=" + model + ", latencyMs=" + latencyMs)
                .build());
            return new AiTestResult(true, provider.name().toLowerCase(), model, latencyMs, "Conexión correcta");
        } catch (Exception e) {
            long latencyMs = (System.nanoTime() - start) / 1_000_000;
            log.error("IA: prueba de conexión FALLIDA (provider={}, model={}, {} ms) -> {}",
                provider.name().toLowerCase(), model, latencyMs, e.getMessage(), e);
            auditLogService.record(AuditLog.builder()
                .category("AI")
                .action("TEST")
                .username(currentUsername())
                .role(currentRole())
                .entity("ai_settings")
                .path("/api/ai/settings/" + provider.name().toLowerCase() + "/test")
                .method("POST")
                .details("Prueba de conexión fallida: provider=" + provider.name().toLowerCase()
                    + ", error=" + e.getMessage() + ", latencyMs=" + latencyMs)
                .build());
            return new AiTestResult(false, provider.name().toLowerCase(), model, latencyMs, e.getMessage());
        }
    }

    private AiCallSettings settingsFor(AiProviderName provider) {
        Optional<AiSettings> row = aiSettingsRepository.findByProvider(provider.name().toLowerCase());
        if (row.isEmpty()) {
            return new AiCallSettings(
                provider, aiProperties.getModel(), aiProperties.getBaseUrl(), aiProperties.getApiKey(), null,
                aiProperties.getTemperature(), aiProperties.getMaxTokens(), aiProperties.getTimeoutMs());
        }
        AiSettings s = row.get();
        return new AiCallSettings(
            provider, s.getModel(), s.getBaseUrl(), decryptKey(s), s.getUsername(),
            s.getTemperature(), s.getMaxTokens(), s.getTimeoutMs());
    }

    private AiProviderSettings toProviderSettings(AiSettings s) {
        return new AiProviderSettings(
            s.getProvider(), s.getModel(), s.getBaseUrl(), s.getUsername(),
            s.getApiKeyCipher() != null && !s.getApiKeyCipher().isBlank(),
            s.getTemperature(), s.getMaxTokens(), s.getTimeoutMs(),
            Boolean.TRUE.equals(s.getIsActive()));
    }

    private AiProviderName requireProvider(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("El proveedor es obligatorio");
        }
        try {
            return AiProviderName.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Proveedor no válido: " + value);
        }
    }

    private String decryptKey(AiSettings settings) {
        if (settings.getApiKeyCipher() == null || settings.getApiKeyCipher().isBlank()) {
            return null;
        }
        return cryptoService.decrypt(settings.getApiKeyIv() + ":" + settings.getApiKeyCipher());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication == null ? null : authentication.getName();
    }

    private String currentRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getAuthorities().isEmpty()) {
            return null;
        }
        return authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
    }
}