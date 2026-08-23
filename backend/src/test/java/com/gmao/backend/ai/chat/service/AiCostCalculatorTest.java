package com.gmao.backend.ai.chat.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AiCostCalculatorTest {

    private final AiCostCalculator calculator = new AiCostCalculator();

    @Test
    void zeroTokensCostZero() {
        assertEquals(0.0, calculator.estimateCost("gpt-4o-mini", 0, 0));
    }

    @Test
    void miniModelUsesMiniRates() {
        assertEquals(0.15, calculator.estimateCost("gpt-4o-mini", 1_000_000, 0));
        assertEquals(0.60, calculator.estimateCost("gpt-4o-mini", 0, 1_000_000));
    }

    @Test
    void gpt4oUsesPremiumRates() {
        assertEquals(2.50, calculator.estimateCost("gpt-4o", 1_000_000, 0));
        assertEquals(10.00, calculator.estimateCost("gpt-4o", 0, 1_000_000));
    }

    @Test
    void unknownModelUsesDefaults() {
        assertEquals(0.15, calculator.estimateCost("modelo-desconocido", 1_000_000, 0));
    }

    @Test
    void nullModelUsesDefaults() {
        assertEquals(0.60, calculator.estimateCost(null, 0, 1_000_000));
    }
}