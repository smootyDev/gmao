package com.gmao.backend.ai.settings.controller;

import com.gmao.backend.ai.settings.dto.AiEnabledRequest;
import com.gmao.backend.ai.settings.dto.AiSettingsRequest;
import com.gmao.backend.ai.settings.dto.AiSettingsResponse;
import com.gmao.backend.ai.settings.dto.AiTestResult;
import com.gmao.backend.ai.settings.service.AiSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/settings")
@CrossOrigin(origins = "*")
public class AiSettingsController {

    private final AiSettingsService aiSettingsService;

    public AiSettingsController(AiSettingsService aiSettingsService) {
        this.aiSettingsService = aiSettingsService;
    }

    @GetMapping
    public ResponseEntity<AiSettingsResponse> get() {
        return ResponseEntity.ok(aiSettingsService.getSettings());
    }

    @PutMapping
    public ResponseEntity<AiSettingsResponse> update(@RequestBody AiSettingsRequest request) {
        return ResponseEntity.ok(aiSettingsService.updateSettings(request));
    }

    @PutMapping("/enabled")
    public ResponseEntity<AiSettingsResponse> setEnabled(@RequestBody AiEnabledRequest request) {
        return ResponseEntity.ok(aiSettingsService.setEnabled(request.enabled()));
    }

    @PostMapping("/{provider}/test")
    public ResponseEntity<AiTestResult> test(@PathVariable String provider) {
        return ResponseEntity.ok(aiSettingsService.testConnection(provider));
    }

    @PostMapping("/{provider}/activate")
    public ResponseEntity<AiSettingsResponse> activate(@PathVariable String provider) {
        return ResponseEntity.ok(aiSettingsService.activate(provider));
    }
}