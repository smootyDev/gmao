package com.gmao.backend.inventory.service;

import com.gmao.backend.inventory.entity.InventoryItem;
import com.gmao.backend.inventory.repository.InventoryItemRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class InventoryItemService {

    private final InventoryItemRepository inventoryItemRepository;

    public InventoryItemService(InventoryItemRepository inventoryItemRepository) {
        this.inventoryItemRepository = inventoryItemRepository;
    }

    public InventoryItem create(InventoryItem item) {
        if (item.getClientId() != null && !item.getClientId().isBlank()) {
            return inventoryItemRepository.findByClientId(item.getClientId())
                .orElseGet(() -> {
                    validate(item);
                    ensureCodeAvailable(item.getCode(), null);
                    applyDefaults(item);
                    return inventoryItemRepository.save(item);
                });
        }
        validate(item);
        ensureCodeAvailable(item.getCode(), null);
        applyDefaults(item);
        return inventoryItemRepository.save(item);
    }

    public List<InventoryItem> list() {
        return inventoryItemRepository.findAllByOrderByNameAsc();
    }

    public Optional<InventoryItem> get(Long id) {
        return inventoryItemRepository.findById(id);
    }

    public InventoryItem update(Long id, InventoryItem item) {
        InventoryItem existing = inventoryItemRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Artículo de inventario no encontrado"));
        validate(item);
        ensureCodeAvailable(item.getCode(), id);
        existing.setCode(item.getCode());
        existing.setName(item.getName());
        existing.setDescription(item.getDescription());
        existing.setCategory(item.getCategory());
        existing.setUnit(item.getUnit());
        existing.setMinimumStock(item.getMinimumStock() == null ? 0.0 : item.getMinimumStock());
        existing.setCurrentStock(item.getCurrentStock() == null ? 0.0 : item.getCurrentStock());
        existing.setLocationId(item.getLocationId());
        existing.setActive(item.getActive() == null || item.getActive());
        return inventoryItemRepository.save(existing);
    }

    public void delete(Long id) {
        if (!inventoryItemRepository.existsById(id)) {
            throw new IllegalArgumentException("Artículo de inventario no encontrado");
        }
        try {
            inventoryItemRepository.deleteById(id);
            inventoryItemRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("No se puede eliminar un artículo de inventario en uso");
        }
    }

    private void applyDefaults(InventoryItem item) {
        item.setMinimumStock(item.getMinimumStock() == null ? 0.0 : item.getMinimumStock());
        item.setCurrentStock(item.getCurrentStock() == null ? 0.0 : item.getCurrentStock());
        item.setActive(item.getActive() == null || item.getActive());
    }

    private void validate(InventoryItem item) {
        if (item.getCode() == null || item.getCode().isBlank()) {
            throw new IllegalArgumentException("El código es obligatorio");
        }
        if (item.getName() == null || item.getName().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
    }

    private void ensureCodeAvailable(String code, Long currentId) {
        inventoryItemRepository.findByCodeIgnoreCase(code)
            .filter(found -> currentId == null || !found.getId().equals(currentId))
            .ifPresent(found -> { throw new IllegalArgumentException("El código de artículo ya existe"); });
    }
}
