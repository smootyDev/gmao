package com.gmao.backend.auth.dto;

import com.gmao.backend.auth.entity.Role;

public record UserRequest(
    String employeeCode,
    String username,
    String firstName,
    String lastName,
    String email,
    String phone,
    String department,
    String password,
    Role role,
    Boolean active
) {}
