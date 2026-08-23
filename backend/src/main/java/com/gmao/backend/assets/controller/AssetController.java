package com.gmao.backend.assets.controller;

import com.gmao.backend.assets.entity.Asset;
import com.gmao.backend.assets.service.AssetService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class AssetController {

    private final AssetService assetService;

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Asset> create(@RequestBody Asset asset) {
        return ResponseEntity.ok(assetService.create(asset));
    }

    @GetMapping
    public ResponseEntity<List<Asset>> list() {
        return ResponseEntity.ok(assetService.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Asset> get(@PathVariable Long id) {
        return assetService.get(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Asset> update(@PathVariable Long id, @RequestBody Asset asset) {
        return ResponseEntity.ok(assetService.update(id, asset));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        assetService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
