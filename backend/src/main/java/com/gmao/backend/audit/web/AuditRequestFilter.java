package com.gmao.backend.audit.web;

import com.gmao.backend.audit.entity.AuditLog;
import com.gmao.backend.audit.service.AuditLogService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class AuditRequestFilter extends OncePerRequestFilter {

    private static final String API_PREFIX = "/api/";

    private final AuditLogService auditLogService;
    private final AuditSanitizer auditSanitizer;

    public AuditRequestFilter(AuditLogService auditLogService, AuditSanitizer auditSanitizer) {
        this.auditLogService = auditLogService;
        this.auditSanitizer = auditSanitizer;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (!path.startsWith(API_PREFIX)) {
            return true;
        }
        if (path.startsWith("/api/ai/") || path.startsWith("/api/audit-logs")) {
            return true;
        }
        String method = request.getMethod();
        return !(HttpMethod.POST.matches(method) || HttpMethod.PUT.matches(method)
            || HttpMethod.DELETE.matches(method));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        ContentCachingRequestWrapper requestWrapper =
            new ContentCachingRequestWrapper(request, 32768);
        long start = System.nanoTime();
        try {
            filterChain.doFilter(requestWrapper, response);
        } finally {
            record(requestWrapper, response, (System.nanoTime() - start) / 1_000_000);
        }
    }

    private void record(ContentCachingRequestWrapper request, HttpServletResponse response, long latencyMs) {
        try {
            String path = request.getRequestURI();
            String method = request.getMethod();
            String body = readBody(request);

            String username = currentUsername();
            String role = currentRole();
            String category = path.startsWith("/api/auth/") ? "AUTH" : "CRUD";
            String action = switch (method) {
                case "POST" -> path.startsWith("/api/auth/") ? "LOGIN" : "CREATE";
                case "PUT" -> "UPDATE";
                case "DELETE" -> "DELETE";
                default -> method;
            };

            String entity = resolveEntity(path);
            String entityId = resolveEntityId(path, body);

            AuditLog auditLog = AuditLog.builder()
                .category(category)
                .action(action)
                .username(username)
                .role(role)
                .entity(entity)
                .entityId(entityId)
                .method(method)
                .path(path)
                .ip(request.getRemoteAddr())
                .statusCode(response.getStatus())
                .requestBody(auditSanitizer.sanitize(body))
                .latencyMs(latencyMs)
                .build();

            auditLogService.record(auditLog);
        } catch (Exception e) {
            System.out.println("[audit] No se pudo registrar la petición " + request.getRequestURI() + ": " + e.getMessage());
        }
    }

    private String readBody(ContentCachingRequestWrapper request) throws IOException {
        byte[] content = request.getContentAsByteArray();
        if (content == null || content.length == 0) {
            return null;
        }
        return new String(content, StandardCharsets.UTF_8);
    }

    private String resolveEntity(String path) {
        String rest = path.substring(API_PREFIX.length());
        int slash = rest.indexOf('/');
        return slash < 0 ? rest : rest.substring(0, slash);
    }

    private String resolveEntityId(String path, String body) {
        String rest = path.substring(API_PREFIX.length());
        String[] segments = rest.split("/");
        if (segments.length >= 3) {
            String candidate = segments[2];
            if (candidate.matches("\\d+")) {
                return candidate;
            }
        }
        if (body != null) {
            java.util.regex.Matcher matcher =
                java.util.regex.Pattern.compile("\"id\"\\s*:\\s*(\\d+)").matcher(body);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return null;
    }

    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
            || "anonymousUser".equals(authentication.getName())) {
            return null;
        }
        return authentication.getName();
    }

    private String currentRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getAuthorities().isEmpty()) {
            return null;
        }
        return authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
    }
}