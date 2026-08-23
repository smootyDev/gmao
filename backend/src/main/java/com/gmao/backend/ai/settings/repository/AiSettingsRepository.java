package com.gmao.backend.ai.settings.repository;

import com.gmao.backend.ai.settings.entity.AiSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiSettingsRepository extends JpaRepository<AiSettings, Long> {

    Optional<AiSettings> findByProvider(String provider);

    Optional<AiSettings> findByIsActiveTrue();

    @Modifying
    @Query("UPDATE AiSettings s SET s.isActive = false WHERE s.isActive = true")
    void deactivateAll();
}