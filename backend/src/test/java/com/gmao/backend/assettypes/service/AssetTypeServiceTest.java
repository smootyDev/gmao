package com.gmao.backend.assettypes.service;

import com.gmao.backend.assettypes.entity.AssetType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
class AssetTypeServiceTest {

    @Autowired
    private AssetTypeService assetTypeService;

    @Test
    void createsActiveAssetType() {
        AssetType assetType = assetTypeService.create(AssetType.builder()
            .code("TEST-TYPE")
            .name("Test type")
            .build());

        assertNotNull(assetType.getId());
        assertEquals(Boolean.TRUE, assetType.getActive());
    }

    @Test
    void rejectsDuplicateCode() {
        assetTypeService.create(AssetType.builder().code("DUP-TYPE").name("First").build());

        assertThrows(IllegalArgumentException.class, () -> assetTypeService.create(
            AssetType.builder().code("dup-type").name("Second").build()
        ));
    }
}
