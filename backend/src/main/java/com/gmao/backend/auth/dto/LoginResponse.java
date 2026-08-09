package com.gmao.backend.auth.dto;

public record LoginResponse(
    String token,
    String type,
    String username,
    String role
) {}
