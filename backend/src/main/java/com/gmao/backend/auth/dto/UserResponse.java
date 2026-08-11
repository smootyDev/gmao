package com.gmao.backend.auth.dto;

import com.gmao.backend.auth.entity.Role;

import java.time.Instant;

public record UserResponse(
    Long id,
    String employeeCode,
    String username,
    String firstName,
    String lastName,
    String email,
    String phone,
    String department,
    Role role,
    Boolean active,
    Instant createdAt
) {}
