package com.gmao.backend.preventive.repository;

import com.gmao.backend.preventive.entity.PreventivePlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PreventivePlanRepository extends JpaRepository<PreventivePlan, Long> {

    Optional<PreventivePlan> findByClientId(String clientId);

    List<PreventivePlan> findAllByOrderByNameAsc();

    List<PreventivePlan> findByAssetId(Long assetId);
}
