package com.gmao.backend.auth.dto;

public record LoginResponse(
    Long id,
    String token,
    String type,
    String username,
    String role
) {}