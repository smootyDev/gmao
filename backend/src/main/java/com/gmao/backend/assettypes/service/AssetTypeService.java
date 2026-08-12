package com.gmao.backend.assettypes.service;

import com.gmao.backend.assettypes.entity.AssetType;
import com.gmao.backend.assettypes.repository.AssetTypeRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AssetTypeService {

    private final AssetTypeRepository assetTypeRepository;

    public AssetTypeService(AssetTypeRepository assetTypeRepository) {
        this.assetTypeRepository = assetTypeRepository;
    }

    public AssetType create(AssetType assetType) {
        if (assetType.getClientId() != null && !assetType.getClientId().isBlank()) {
            return assetTypeRepository.findByClientId(assetType.getClientId())
                .orElseGet(() -> {
                    validate(assetType);
                    ensureCodeAvailable(assetType.getCode(), null);
                    assetType.setActive(assetType.getActive() == null || assetType.getActive());
                    return assetTypeRepository.save(assetType);
                });
        }
        validate(assetType);
        ensureCodeAvailable(assetType.getCode(), null);
        assetType.setActive(assetType.getActive() == null || assetType.getActive());
        return assetTypeRepository.save(assetType);
    }

    public List<AssetType> list() {
        return assetTypeRepository.findAllByOrderByNameAsc();
    }

    public Optional<AssetType> get(Long id) {
        return assetTypeRepository.findById(id);
    }

    public AssetType update(Long id, AssetType assetType) {
        AssetType existing = assetTypeRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Tipo de activo no encontrado"));
        validate(assetType);
        ensureCodeAvailable(assetType.getCode(), id);
        existing.setCode(assetType.getCode());
        existing.setName(assetType.getName());
        existing.setDescription(assetType.getDescription());
        existing.setActive(assetType.getActive() == null || assetType.getActive());
        return assetTypeRepository.save(existing);
    }

    public void delete(Long id) {
        if (!assetTypeRepository.existsById(id)) {
            throw new IllegalArgumentException("Tipo de activo no encontrado");
        }
        try {
            assetTypeRepository.deleteById(id);
            assetTypeRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("No se puede eliminar un tipo de activo en uso");
        }
    }

    private void validate(AssetType assetType) {
        if (assetType.getCode() == null || assetType.getCode().isBlank()) {
            throw new IllegalArgumentException("El código es obligatorio");
        }
        if (assetType.getName() == null || assetType.getName().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
    }

    private void ensureCodeAvailable(String code, Long currentId) {
        assetTypeRepository.findByCodeIgnoreCase(code)
            .filter(found -> currentId == null || !found.getId().equals(currentId))
            .ifPresent(found -> { throw new IllegalArgumentException("El código de tipo ya existe"); });
    }
}
