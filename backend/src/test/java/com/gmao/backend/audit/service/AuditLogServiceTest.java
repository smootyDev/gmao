package com.gmao.backend.audit.service;

import com.gmao.backend.audit.entity.AuditLog;
import com.gmao.backend.audit.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AuditLogServiceTest {

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @BeforeEach
    void cleanUp() {
        auditLogRepository.deleteAll();
    }

    @Test
    void recordPersistsAuditLog() {
        AuditLog auditLog = AuditLog.builder()
            .category("CRUD")
            .action("CREATE")
            .username("admin")
            .role("ADMIN")
            .entity("workorders")
            .method("POST")
            .path("/api/workorders")
            .statusCode(200)
            .build();

        auditLogService.record(auditLog);

        assertEquals(1, auditLogRepository.count());
        AuditLog stored = auditLogRepository.findAll().get(0);
        assertNotNull(stored.getId());
        assertNotNull(stored.getTimestamp());
        assertEquals("workorders", stored.getEntity());
    }

    @Test
    void searchFiltersByCategoryAndEntity() {
        auditLogService.record(AuditLog.builder().category("CRUD").action("CREATE").entity("workorders").build());
        auditLogService.record(AuditLog.builder().category("CRUD").action("CREATE").entity("assets").build());
        auditLogService.record(AuditLog.builder().category("AI").action("CHAT").entity("ai").build());

        Page<AuditLog> page = auditLogService.search("CRUD", null, null, null, null, null, null,
            PageRequest.of(0, 50));

        assertEquals(2, page.getTotalElements());

        Page<AuditLog> byEntity = auditLogService.search(null, "assets", null, null, null, null, null,
            PageRequest.of(0, 50));
        assertEquals(1, byEntity.getTotalElements());
        assertEquals("assets", byEntity.getContent().get(0).getEntity());
    }

    @Test
    void searchFiltersByDateRange() {
        auditLogService.record(AuditLog.builder().category("CRUD").action("CREATE").timestamp(Instant.now()).build());
        auditLogService.record(AuditLog.builder().category("CRUD").action("CREATE")
            .timestamp(Instant.now().minus(30, ChronoUnit.DAYS)).build());

        Instant from = Instant.now().minus(1, ChronoUnit.DAYS);
        Page<AuditLog> page = auditLogService.search(null, null, null, null, null, from, null,
            PageRequest.of(0, 50));

        assertEquals(1, page.getTotalElements());
    }

    @Test
    void searchFiltersByActionAndUsername() {
        auditLogService.record(AuditLog.builder().category("AI").action("CHAT").username("admin").build());
        auditLogService.record(AuditLog.builder().category("AI").action("SUGGEST").username("admin").build());
        auditLogService.record(AuditLog.builder().category("AI").action("CHAT").username("tecnico").build());

        Page<AuditLog> byUsername = auditLogService.search(null, null, null, "ADMIN", null, null, null,
            PageRequest.of(0, 50));
        assertEquals(2, byUsername.getTotalElements());

        Page<AuditLog> byAction = auditLogService.search(null, null, "chat", null, null, null, null,
            PageRequest.of(0, 50));
        assertEquals(2, byAction.getTotalElements());
    }

    @Test
    void purgeRemovesOnlyExpiredLogs() {
        auditLogService.record(AuditLog.builder().category("CRUD").action("CREATE")
            .timestamp(Instant.now().minus(200, ChronoUnit.DAYS)).build());
        auditLogService.record(AuditLog.builder().category("CRUD").action("CREATE")
            .timestamp(Instant.now()).build());

        long deleted = auditLogService.purgeBefore(Instant.now().minus(90, ChronoUnit.DAYS));

        assertEquals(1, deleted);
        assertEquals(1, auditLogRepository.count());
    }
}