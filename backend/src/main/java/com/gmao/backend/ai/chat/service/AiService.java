package com.gmao.backend.ai.chat.service;

import com.gmao.backend.ai.AiException;
import com.gmao.backend.ai.settings.config.AiProperties;
import com.gmao.backend.ai.chat.dto.*;
import com.gmao.backend.ai.settings.service.AiSettingsService;
import com.gmao.backend.ai.provider.AiCallSettings;
import com.gmao.backend.ai.provider.AiCompletion;
import com.gmao.backend.ai.provider.AiProvider;
import com.gmao.backend.ai.provider.AiProviderFactory;
import com.gmao.backend.ai.provider.AiProviderName;
import com.gmao.backend.audit.entity.AuditLog;
import com.gmao.backend.audit.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final AiSettingsService aiSettingsService;
    private final AiProviderFactory providerFactory;
    private final AiContextBuilder contextBuilder;
    private final AiCostCalculator costCalculator;
    private final AiProperties aiProperties;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public AiService(AiSettingsService aiSettingsService,
                     AiProviderFactory providerFactory,
                     AiContextBuilder contextBuilder,
                     AiCostCalculator costCalculator,
                     AiProperties aiProperties,
                     AuditLogService auditLogService,
                     ObjectMapper objectMapper) {
        this.aiSettingsService = aiSettingsService;
        this.providerFactory = providerFactory;
        this.contextBuilder = contextBuilder;
        this.costCalculator = costCalculator;
        this.aiProperties = aiProperties;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    public AiChatResponse chat(String message) {
        ensureEnabled();
        if (message == null || message.isBlank()) {
            throw new AiException("El mensaje no puede estar vacío");
        }
        AiCallSettings settings = aiSettingsService.getEffectiveSettings();
        String system = "Eres el asistente del sistema GMAO (gestión de mantenimiento). "
            + "Respondes en el idioma del usuario usando datos reales del sistema.\n"
            + "CONTEXTO DE ÓRDENES DE TRABAJO:\n" + contextBuilder.buildWorkOrdersContext()
            + "\nCONTEXTO DE ACTIVOS:\n" + contextBuilder.buildAssetsContext()
            + "\nCONTEXTO DE PLANES PREVENTIVOS:\n" + contextBuilder.buildPreventiveContext()
            + "\nNo inventes datos. Si no sabes algo, indícalo.";

        if (settings.provider() == AiProviderName.MOCK) {
            return mockChat(message, settings);
        }

        long start = System.nanoTime();
        AiCompletion completion = invoke("CHAT", system, message, settings);
        long latencyMs = (System.nanoTime() - start) / 1_000_000;
        double cost = costCalculator.estimateCost(settings.model(), completion.tokensIn(), completion.tokensOut());
        audit("CHAT", "assistant/chat", settings, completion, cost, latencyMs, message);
        return new AiChatResponse(completion.text(), usage(completion, cost, latencyMs));
    }

    public AiSuggestResponse suggest(String description, String assetName, String notes) {
        ensureEnabled();
        if (description == null || description.isBlank()) {
            throw new AiException("La descripción es obligatoria para sugerir una OT");
        }
        AiCallSettings settings = aiSettingsService.getEffectiveSettings();
        String user = "Genera una orden de trabajo para la siguiente avería/solicitud.\n"
            + "Descripción: " + description
            + (assetName == null || assetName.isBlank() ? "" : "\nActivo: " + assetName)
            + (notes == null || notes.isBlank() ? "" : "\nNotas: " + notes)
            + "\nDevuelve SOLO JSON con: title (string), description (string), "
            + "priority (integer 1=urgente,2=alta,3=media,4=baja), estimatedHours (number), "
            + "checklist (array de strings con los pasos de trabajo).";
        String system = "Eres un planificador de mantenimiento. Generas órdenes de trabajo "
            + "estructuradas y accionables. Nunca inventas equipos ni códigos.";

        if (settings.provider() == AiProviderName.MOCK) {
            return mockSuggest(description, assetName, settings);
        }

        long start = System.nanoTime();
        AiCompletion completion = invoke("SUGGEST", system, user, settings);
        long latencyMs = (System.nanoTime() - start) / 1_000_000;
        double cost = costCalculator.estimateCost(settings.model(), completion.tokensIn(), completion.tokensOut());
        audit("SUGGEST", "workorders/suggest", settings, completion, cost, latencyMs, description);
        return parse(completion.text(), AiSuggestResponse.class);
    }

    public AiPrioritizeResponse prioritize(List<Long> workOrderIds) {
        ensureEnabled();
        AiCallSettings settings = aiSettingsService.getEffectiveSettings();
        String orders = contextBuilder.buildWorkOrdersContext();
        String user = "Analiza las siguientes órdenes de trabajo y propón una prioridad "
            + "(1=urgente,2=alta,3=media,4=baja) para cada una con una breve justificación.\n"
            + (workOrderIds == null || workOrderIds.isEmpty()
                ? "Considera todas las órdenes listadas." : "Considera solo estas: " + workOrderIds)
            + "\nÓRDENES:\n" + orders
            + "\nDevuelve SOLO JSON: {\"suggestions\":[{\"workOrderId\":1,\"suggestedPriority\":1,"
            + "\"reason\":\"...\"}]}";
        String system = "Eres un gestor de mantenimiento experto en priorización de órdenes "
            + "de trabajo. Justificas en una frase concisa cada sugerencia.";

        if (settings.provider() == AiProviderName.MOCK) {
            return mockPrioritize(workOrderIds, settings);
        }

        long start = System.nanoTime();
        AiCompletion completion = invoke("PRIORITIZE", system, user, settings);
        long latencyMs = (System.nanoTime() - start) / 1_000_000;
        double cost = costCalculator.estimateCost(settings.model(), completion.tokensIn(), completion.tokensOut());
        audit("PRIORITIZE", "workorders/prioritize", settings, completion, cost, latencyMs, user);
        return parse(completion.text(), AiPrioritizeResponse.class);
    }

    public AiSummarizeResponse summarize(String scope, Instant from, Instant to) {
        ensureEnabled();
        AiCallSettings settings = aiSettingsService.getEffectiveSettings();
        String context = contextBuilder.buildSummaryContext(from, to);
        String user = "Genera un resumen ejecutivo del mantenimiento"
            + (scope == null || scope.isBlank() ? "" : " (" + scope + ")")
            + ".\nDATOS:\n" + context
            + "\nResume en 3-5 frases, destacando pendientes, riesgos y siguientes pasos.";
        String system = "Eres un analista de mantenimiento. Produces resúmenes ejecutivos "
            + "claros, en el idioma del usuario, basados solo en los datos dados.";

        if (settings.provider() == AiProviderName.MOCK) {
            AiCompletion completion = new AiCompletion(
                "Resumen simulado (proveedor 'mock'): hay actividad de mantenimiento en el periodo; "
                    + "revisa las OTs abiertas y planifica los preventivos pendientes.",
                estimateTokens(user), 0);
            audit("SUMMARIZE", "summarize", settings, completion, 0.0, 0, user);
            return new AiSummarizeResponse(completion.text());
        }

        long start = System.nanoTime();
        AiCompletion completion = invoke("SUMMARIZE", system, user, settings);
        long latencyMs = (System.nanoTime() - start) / 1_000_000;
        double cost = costCalculator.estimateCost(settings.model(), completion.tokensIn(), completion.tokensOut());
        audit("SUMMARIZE", "summarize", settings, completion, cost, latencyMs, user);
        return new AiSummarizeResponse(completion.text());
    }

    private AiCompletion invoke(String operation, String system, String user, AiCallSettings settings) {
        String provider = settings.provider().name().toLowerCase();
        String model = settings.model() == null ? "-" : settings.model();
        long start = System.nanoTime();
        log.info("IA [{}] -> llamada a provider={}, model={}", operation, provider, model);
        try {
            AiCompletion completion = providerFactory.adapterFor(settings.provider())
                .complete(system, user, settings);
            long latencyMs = (System.nanoTime() - start) / 1_000_000;
            log.info("IA [{}] <- provider={}, model={}, tokensIn={}, tokensOut={}, {} ms",
                operation, provider, model, completion.tokensIn(), completion.tokensOut(), latencyMs);
            return completion;
        } catch (Exception e) {
            long latencyMs = (System.nanoTime() - start) / 1_000_000;
            log.error("IA [{}] FALLÓ: provider={}, model={}, {} ms -> {}", operation, provider, model,
                latencyMs, e.getMessage(), e);
            if (e instanceof AiException) {
                throw (AiException) e;
            }
            throw new AiException("Error al invocar al proveedor de IA: " + e.getMessage());
        }
    }

    private void ensureEnabled() {
        if (!aiSettingsService.isEnabled()) {
            throw new AiException("El módulo de IA no está habilitado");
        }
    }

    private AiChatResponse mockChat(String message, AiCallSettings settings) {
        String reply = "Respuesta simulada del asistente (proveedor 'mock'). "
            + "Mensaje recibido: " + truncate(message, 120);
        AiCompletion completion = new AiCompletion(reply, estimateTokens(message), estimateTokens(reply));
        audit("CHAT", "assistant/chat", settings, completion, 0.0, 0, message);
        return new AiChatResponse(reply, usage(completion, 0.0, 0));
    }

    private AiSuggestResponse mockSuggest(String description, String assetName, AiCallSettings settings) {
        String title = "Mantenimiento: " + truncate(description, 60);
        AiSuggestResponse response = new AiSuggestResponse(
            title,
            description,
            3,
            2.5,
            List.of("Inspeccionar el estado actual", "Realizar la intervención descrita",
                "Verificar el funcionamiento tras la intervención", "Registrar horas y observaciones")
        );
        String prompt = "suggest: " + description + (assetName == null ? "" : " / " + assetName);
        AiCompletion completion = new AiCompletion(title, estimateTokens(prompt), estimateTokens(title));
        audit("SUGGEST", "workorders/suggest", settings, completion, 0.0, 0, prompt);
        return response;
    }

    private AiPrioritizeResponse mockPrioritize(List<Long> workOrderIds, AiCallSettings settings) {
        String context = contextBuilder.buildWorkOrdersContext();
        List<AiPrioritizeSuggestion> suggestions = java.util.stream.Stream.of(context.split("\n"))
            .filter(line -> line.startsWith("OT#"))
            .map(line -> {
                int hash = line.hashCode();
                long id = extractId(line);
                int priority = 1 + Math.abs(hash % 4);
                return new AiPrioritizeSuggestion(id, priority, "Prioridad sugerida automáticamente (modo simulado)");
            })
            .filter(s -> workOrderIds == null || workOrderIds.isEmpty()
                || workOrderIds.contains(s.workOrderId()))
            .limit(20)
            .toList();
        AiCompletion completion = new AiCompletion(context, estimateTokens(context), estimateTokens(context));
        audit("PRIORITIZE", "workorders/prioritize", settings, completion, 0.0, 0, context);
        return new AiPrioritizeResponse(suggestions);
    }

    private long estimateTokens(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return Math.max(1, text.split("\\s+").length / 2);
    }

    private long extractId(String line) {
        java.util.regex.Matcher matcher =
            java.util.regex.Pattern.compile("OT#(\\d+)").matcher(line);
        return matcher.find() ? Long.parseLong(matcher.group(1)) : 0L;
    }

    private <T> T parse(String text, Class<T> type) {
        try {
            int start = text.indexOf('{');
            int end = text.lastIndexOf('}');
            if (start < 0 || end < start) {
                throw new AiException("El proveedor no devolvió JSON válido");
            }
            return objectMapper.readValue(text.substring(start, end + 1), type);
        } catch (AiException e) {
            throw e;
        } catch (Exception e) {
            throw new AiException("No se pudo interpretar la respuesta del proveedor: " + e.getMessage());
        }
    }

    private AiUsage usage(AiCompletion completion, double cost, long latencyMs) {
        return new AiUsage(completion.tokensIn(), completion.tokensOut(), latencyMs, cost);
    }

    private void audit(String action, String path, AiCallSettings settings,
                       AiCompletion completion, double cost, long latencyMs, String prompt) {
        String details = "provider=" + settings.provider().name().toLowerCase()
            + ", model=" + (settings.model() == null ? "-" : settings.model())
            + ", tokensIn=" + completion.tokensIn()
            + ", tokensOut=" + completion.tokensOut()
            + ", cost=" + cost
            + ", latencyMs=" + latencyMs;
        if (aiProperties.isStoreContent()) {
            details += ", prompt=" + truncate(prompt, 300);
        }
        auditLogService.record(AuditLog.builder()
            .category("AI")
            .action(action)
            .username(currentUsername())
            .role(currentRole())
            .entity("ai")
            .path("/api/ai/" + path)
            .method("POST")
            .details(details)
            .latencyMs(latencyMs)
            .build());
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

    private String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}