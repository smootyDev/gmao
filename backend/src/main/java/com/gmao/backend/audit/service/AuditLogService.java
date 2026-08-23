package com.gmao.backend.audit.service;

import com.gmao.backend.audit.entity.AuditLog;
import com.gmao.backend.audit.repository.AuditLogRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(AuditLog auditLog) {
        if (auditLog == null) {
            return;
        }
        auditLogRepository.save(auditLog);
    }

    public Page<AuditLog> search(String category, String entity, String action, String username,
                                 Long userId, Instant from, Instant to, Pageable pageable) {
        return auditLogRepository.findAll(
            specification(category, entity, action, username, userId, from, to), pageable);
    }

    @Transactional
    public long purgeBefore(Instant cutoff) {
        return auditLogRepository.deleteByTimestampBefore(cutoff);
    }

    private Specification<AuditLog> specification(String category, String entity, String action,
                                                  String username, Long userId,
                                                  Instant from, Instant to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(root.get("category"), category.toUpperCase()));
            }
            if (entity != null && !entity.isBlank()) {
                predicates.add(cb.equal(root.get("entity"), entity));
            }
            if (action != null && !action.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("action")), "%" + action.toLowerCase() + "%"));
            }
            if (username != null && !username.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("username")), "%" + username.toLowerCase() + "%"));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("userId"), userId));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), to));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}