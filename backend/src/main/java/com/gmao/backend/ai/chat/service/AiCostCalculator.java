package com.gmao.backend.ai.chat.service;

import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class AiCostCalculator {

    private static final double DEFAULT_IN_PER_MILLION = 0.15;
    private static final double DEFAULT_OUT_PER_MILLION = 0.60;

    public double estimateCost(String model, long tokensIn, long tokensOut) {
        if (tokensIn <= 0 && tokensOut <= 0) {
            return 0.0;
        }
        double[] rates = ratesFor(model);
        double cost = (tokensIn / 1_000_000.0) * rates[0] + (tokensOut / 1_000_000.0) * rates[1];
        return Math.round(cost * 10000.0) / 10000.0;
    }

    private double[] ratesFor(String model) {
        if (model == null) {
            return new double[]{DEFAULT_IN_PER_MILLION, DEFAULT_OUT_PER_MILLION};
        }
        String m = model.toLowerCase(Locale.ROOT);
        if (m.contains("gpt-4o-mini")) {
            return new double[]{0.15, 0.60};
        }
        if (m.contains("gpt-4o")) {
            return new double[]{2.50, 10.00};
        }
        if (m.contains("claude-3-5-haiku")) {
            return new double[]{0.80, 4.00};
        }
        if (m.contains("gemini-2.0-flash") || m.contains("gemini")) {
            return new double[]{0.10, 0.40};
        }
        return new double[]{DEFAULT_IN_PER_MILLION, DEFAULT_OUT_PER_MILLION};
    }
}