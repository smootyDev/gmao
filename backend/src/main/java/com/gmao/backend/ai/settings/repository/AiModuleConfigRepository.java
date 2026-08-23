package com.gmao.backend.ai.settings.repository;

import com.gmao.backend.ai.settings.entity.AiModuleConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiModuleConfigRepository extends JpaRepository<AiModuleConfig, Long> {
}