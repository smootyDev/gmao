package com.gmao.backend.ai.settings.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ai")
public class AiProperties {

    private boolean enabled = false;
    private String provider = "mock";
    private String apiKey = "";
    private String baseUrl = "";
    private String model = "";
    private long timeoutMs = 30000;
    private Integer maxTokens = 1000;
    private Double temperature = 0.2;
    private String settingsEncryptionKey = "";
    private boolean storeContent = false;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public long getTimeoutMs() {
        return timeoutMs;
    }

    public void setTimeoutMs(long timeoutMs) {
        this.timeoutMs = timeoutMs;
    }

    public Integer getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(Integer maxTokens) {
        this.maxTokens = maxTokens;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public String getSettingsEncryptionKey() {
        return settingsEncryptionKey;
    }

    public void setSettingsEncryptionKey(String settingsEncryptionKey) {
        this.settingsEncryptionKey = settingsEncryptionKey;
    }

    public boolean isStoreContent() {
        return storeContent;
    }

    public void setStoreContent(boolean storeContent) {
        this.storeContent = storeContent;
    }
}