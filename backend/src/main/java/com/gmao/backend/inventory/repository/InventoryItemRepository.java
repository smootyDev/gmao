package com.gmao.backend.inventory.repository;

import com.gmao.backend.inventory.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    Optional<InventoryItem> findByCodeIgnoreCase(String code);

    Optional<InventoryItem> findByClientId(String clientId);

    List<InventoryItem> findAllByOrderByNameAsc();
}
