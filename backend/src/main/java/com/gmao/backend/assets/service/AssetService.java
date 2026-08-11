package com.gmao.backend.assets.service;

import com.gmao.backend.assets.entity.Asset;
import com.gmao.backend.assets.repository.AssetRepository;
import com.gmao.backend.locations.repository.LocationRepository;
import com.gmao.backend.assettypes.repository.AssetTypeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AssetService {

    private final AssetRepository assetRepository;
    private final LocationRepository locationRepository;
    private final AssetTypeRepository assetTypeRepository;

    public AssetService(
        AssetRepository assetRepository,
        LocationRepository locationRepository,
        AssetTypeRepository assetTypeRepository
    ) {
        this.assetRepository = assetRepository;
        this.locationRepository = locationRepository;
        this.assetTypeRepository = assetTypeRepository;
    }

    public Asset create(Asset asset) {
        validateLocation(asset.getLocationId());
        validateType(asset.getTypeId());
        return assetRepository.save(asset);
    }

    public List<Asset> list() {
        return assetRepository.findAll();
    }

    public Optional<Asset> get(Long id) {
        return assetRepository.findById(id);
    }

    public Asset update(Long id, Asset asset) {
        Asset existing = assetRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Activo no encontrado"));
        existing.setName(asset.getName());
        existing.setDescription(asset.getDescription());
        existing.setCriticality(asset.getCriticality());
        existing.setStatus(asset.getStatus());
        validateLocation(asset.getLocationId());
        validateType(asset.getTypeId());
        existing.setLocationId(asset.getLocationId());
        existing.setTypeId(asset.getTypeId());
        existing.setSerialNumber(asset.getSerialNumber());
        existing.setHoursOfUse(asset.getHoursOfUse());
        existing.setPurchaseDate(asset.getPurchaseDate());
        return assetRepository.save(existing);
    }

    public void delete(Long id) {
        assetRepository.deleteById(id);
    }

    private void validateLocation(Long locationId) {
        if (locationId != null && !locationRepository.existsById(locationId)) {
            throw new IllegalArgumentException("Localización no encontrada");
        }
    }

    private void validateType(Long typeId) {
        if (typeId != null && !assetTypeRepository.existsById(typeId)) {
            throw new IllegalArgumentException("Tipo de activo no encontrado");
        }
    }
}
