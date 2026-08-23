package com.gmao.backend.audit.web;

import com.gmao.backend.audit.entity.AuditLog;
import com.gmao.backend.audit.repository.AuditLogRepository;
import com.gmao.backend.auth.entity.Role;
import com.gmao.backend.auth.entity.User;
import com.gmao.backend.auth.jwt.JwtProvider;
import com.gmao.backend.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class AuditRequestFilterIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void cleanUp() {
        auditLogRepository.deleteAll();
        userRepository.deleteAll();
        userRepository.save(User.builder()
            .username("admin")
            .employeeCode("EMP-1")
            .firstName("Admin")
            .lastName("Sistema")
            .email("admin@gmao.test")
            .password("x")
            .role(Role.ADMIN)
            .active(true)
            .build());
        userRepository.save(User.builder()
            .username("tech")
            .employeeCode("EMP-2")
            .firstName("Tecnico")
            .lastName("Sistema")
            .email("tech@gmao.test")
            .password("x")
            .role(Role.TECH)
            .active(true)
            .build());
    }

    @Test
    void postCreatesAuditLogEntry() throws Exception {
        mockMvc.perform(post("/api/workorders")
                .header("Authorization", "Bearer " + token("admin", "ROLE_ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Orden auditada\",\"description\":\"test\"}"))
            .andExpect(status().isOk());

        List<AuditLog> logs = auditLogRepository.findAll();
        assertEquals(1, logs.size());
        AuditLog log = logs.get(0);
        assertEquals("CRUD", log.getCategory());
        assertEquals("CREATE", log.getAction());
        assertEquals("workorders", log.getEntity());
        assertEquals("admin", log.getUsername());
        assertEquals("POST", log.getMethod());
        assertEquals("/api/workorders", log.getPath());
        assertNotNull(log.getRequestBody());
        assertTrue(log.getRequestBody().contains("Orden auditada"));
    }

    @Test
    void loginFailureIsAuditedWithRedactedPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"admin\",\"password\":\"contraseña-mala\"}"))
            .andExpect(status().is4xxClientError());

        List<AuditLog> logs = auditLogRepository.findAll();
        assertEquals(1, logs.size());
        AuditLog log = logs.get(0);
        assertEquals("AUTH", log.getCategory());
        assertEquals("LOGIN", log.getAction());
        assertNotNull(log.getRequestBody());
        assertFalse(log.getRequestBody().contains("contraseña-mala"));
    }

    @Test
    void auditLogsEndpointIsAdminOnly() throws Exception {
        mockMvc.perform(get("/api/audit-logs")
                .header("Authorization", "Bearer " + token("tech", "ROLE_TECH")))
            .andExpect(status().isForbidden());
    }

    private String token(String username, String role) {
        Authentication authentication = new UsernamePasswordAuthenticationToken(
            username, null, List.of(new SimpleGrantedAuthority(role)));
        return jwtProvider.generateToken(authentication);
    }
}