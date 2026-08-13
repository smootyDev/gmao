package com.gmao.backend.preventive.service;

import com.gmao.backend.assets.entity.Asset;
import com.gmao.backend.assets.repository.AssetRepository;
import com.gmao.backend.preventive.entity.PreventivePlan;
import com.gmao.backend.workorders.entity.WorkOrder;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class PreventivePlanServiceTest {

    @Autowired
    private PreventivePlanService preventivePlanService;

    @Autowired
    private AssetRepository assetRepository;

    private Long createAsset() {
        Asset asset = Asset.builder()
            .name("Asset preventivo test")
            .build();
        return assetRepository.save(asset).getId();
    }

    @Test
    void createsPlanWithInitialDueDate() {
        PreventivePlan plan = preventivePlanService.create(PreventivePlan.builder()
            .name("Cambio de aceite")
            .assetId(createAsset())
            .frequencyDays(90)
            .build());

        assertNotNull(plan.getId());
        assertEquals(Boolean.TRUE, plan.getActive());
        assertNotNull(plan.getNextDueDate());
        assertEquals(Long.valueOf(0), plan.getWorkOrderCount());
    }

    @Test
    void createWithClientIdIsIdempotent() {
        Long assetId = createAsset();
        PreventivePlan first = preventivePlanService.create(PreventivePlan.builder()
            .name("Revisión")
            .assetId(assetId)
            .frequencyDays(30)
            .clientId("client-plan-001")
            .build());

        PreventivePlan second = preventivePlanService.create(PreventivePlan.builder()
            .name("Revisión")
            .assetId(assetId)
            .frequencyDays(30)
            .clientId("client-plan-001")
            .build());

        assertEquals(first.getId(), second.getId());
    }

    @Test
    void rejectsInvalidFrequency() {
        assertThrows(IllegalArgumentException.class, () -> preventivePlanService.create(
            PreventivePlan.builder().name("Bad").assetId(createAsset()).frequencyDays(0).build()
        ));
    }

    @Test
    void runGeneratesWorkOrderAndUpdatesDates() {
        PreventivePlan plan = preventivePlanService.create(PreventivePlan.builder()
            .name("Mantenimiento motor")
            .assetId(createAsset())
            .frequencyDays(60)
            .build());

        WorkOrder workOrder = preventivePlanService.generateWorkOrder(plan.getId());

        assertNotNull(workOrder.getId());
        assertEquals(plan.getId(), workOrder.getPreventivePlanId());
        assertEquals(plan.getAssetId(), workOrder.getAssetId());
        assertTrue(workOrder.getTitle().contains(plan.getName()));
        assertNotNull(preventivePlanService.get(plan.getId()).orElseThrow().getLastRunAt());
        assertEquals(1, preventivePlanService.getWorkOrderCount(plan.getId()));
    }
}
