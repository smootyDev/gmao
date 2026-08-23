package com.gmao.backend.assettypes.controller;

import com.gmao.backend.assettypes.entity.AssetType;
import com.gmao.backend.assettypes.service.AssetTypeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/asset-types")
@CrossOrigin(origins = "*")
public class AssetTypeController {

    private final AssetTypeService assetTypeService;

    public AssetTypeController(AssetTypeService assetTypeService) {
        this.assetTypeService = assetTypeService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<AssetType> create(@RequestBody AssetType assetType) {
        return ResponseEntity.ok(assetTypeService.create(assetType));
    }

    @GetMapping
    public ResponseEntity<List<AssetType>> list() {
        return ResponseEntity.ok(assetTypeService.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetType> get(@PathVariable Long id) {
        return assetTypeService.get(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<AssetType> update(@PathVariable Long id, @RequestBody AssetType assetType) {
        return ResponseEntity.ok(assetTypeService.update(id, assetType));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        assetTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
