package com.gmao.backend.security;

import com.gmao.backend.auth.entity.User;
import com.gmao.backend.auth.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    private final UserRepository userRepository;

    public SecurityUtils(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication == null ? null : authentication.getName();
    }

    public String currentRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getAuthorities().isEmpty()) {
            return null;
        }
        return authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
    }

    public Long currentUserId() {
        String username = currentUsername();
        if (username == null) {
            return null;
        }
        return userRepository.findByUsername(username).map(User::getId).orElse(null);
    }

    public boolean isTech() {
        return "TECH".equals(currentRole());
    }

    public boolean isAdmin() {
        return "ADMIN".equals(currentRole());
    }

    public boolean isManager() {
        return "MANAGER".equals(currentRole());
    }

    public boolean isCurrentUser(Long userId) {
        Long currentId = currentUserId();
        return currentId != null && currentId.equals(userId);
    }
}