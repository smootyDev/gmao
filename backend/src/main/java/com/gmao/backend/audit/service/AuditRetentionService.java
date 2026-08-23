package com.gmao.backend.audit.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AuditRetentionService {

    private final AuditLogService auditLogService;
    private final int retentionDays;

    public AuditRetentionService(AuditLogService auditLogService,
                                 @Value("${audit.retention-days:90}") int retentionDays) {
        this.auditLogService = auditLogService;
        this.retentionDays = retentionDays;
    }

    @Scheduled(cron = "${audit.purge-cron:0 0 3 * * *}")
    public void purgeExpired() {
        Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        long deleted = auditLogService.purgeBefore(cutoff);
        if (deleted > 0) {
            System.out.println("[audit] Purge: " + deleted + " registros anteriores a " + cutoff);
        }
    }
}