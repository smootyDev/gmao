package com.gmao.backend.assettypes.repository;

import com.gmao.backend.assettypes.entity.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssetTypeRepository extends JpaRepository<AssetType, Long> {

    Optional<AssetType> findByCodeIgnoreCase(String code);

    Optional<AssetType> findByClientId(String clientId);

    List<AssetType> findAllByOrderByNameAsc();
}
