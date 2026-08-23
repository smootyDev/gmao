package com.gmao.backend.ai.chat.controller;

import com.gmao.backend.ai.AiException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice(assignableTypes = AiController.class)
public class AiExceptionHandler {

    @ExceptionHandler(AiException.class)
    public ResponseEntity<Map<String, String>> handleAiException(AiException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of("error", e.getMessage()));
    }
}