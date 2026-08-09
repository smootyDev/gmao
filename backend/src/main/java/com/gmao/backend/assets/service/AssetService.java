package com.gmao.backend.assets.service;

import com.gmao.backend.assets.entity.Asset;
import com.gmao.backend.assets.repository.AssetRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AssetService {

    private final AssetRepository assetRepository;

    public AssetService(AssetRepository assetRepository) {
        this.assetRepository = assetRepository;
    }

    public Asset create(Asset asset) {
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
        existing.setType(asset.getType());
        existing.setCriticality(asset.getCriticality());
        existing.setStatus(asset.getStatus());
        existing.setLocation(asset.getLocation());
        existing.setSerialNumber(asset.getSerialNumber());
        existing.setHoursOfUse(asset.getHoursOfUse());
        existing.setPurchaseDate(asset.getPurchaseDate());
        return assetRepository.save(existing);
    }

    public void delete(Long id) {
        assetRepository.deleteById(id);
    }
}
