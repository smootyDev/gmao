package com.gmao.backend.ai.chat.controller;

import com.gmao.backend.ai.chat.dto.*;
import com.gmao.backend.ai.chat.service.AiService;
import com.gmao.backend.ai.settings.service.AiSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private final AiService aiService;
    private final AiSettingsService aiSettingsService;

    public AiController(AiService aiService, AiSettingsService aiSettingsService) {
        this.aiService = aiService;
        this.aiSettingsService = aiSettingsService;
    }

    @GetMapping("/health")
    public ResponseEntity<AiHealthResponse> health() {
        boolean enabled = aiSettingsService.isEnabled();
        return ResponseEntity.ok(new AiHealthResponse(
            enabled,
            aiSettingsService.effectiveProvider().name().toLowerCase(),
            aiSettingsService.getEffectiveSettings().model(),
            enabled ? "ok" : "disabled"
        ));
    }

    @PostMapping("/assistant/chat")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request) {
        return ResponseEntity.ok(aiService.chat(request.message()));
    }

    @PostMapping("/workorders/suggest")
    public ResponseEntity<AiSuggestResponse> suggest(@RequestBody AiSuggestRequest request) {
        return ResponseEntity.ok(aiService.suggest(request.description(), request.assetName(), request.notes()));
    }

    @PostMapping("/workorders/prioritize")
    public ResponseEntity<AiPrioritizeResponse> prioritize(@RequestBody AiPrioritizeRequest request) {
        return ResponseEntity.ok(aiService.prioritize(request.workOrderIds()));
    }

    @PostMapping("/summarize")
    public ResponseEntity<AiSummarizeResponse> summarize(@RequestBody AiSummarizeRequest request) {
        return ResponseEntity.ok(aiService.summarize(request.scope(), request.from(), request.to()));
    }
}