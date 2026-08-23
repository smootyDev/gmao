package com.gmao.backend.audit.repository;

import com.gmao.backend.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>,
    JpaSpecificationExecutor<AuditLog> {

    List<AuditLog> findByTimestampBefore(Instant timestamp);

    long deleteByTimestampBefore(Instant timestamp);
}