package com.gmao.backend.inventory.service;

import com.gmao.backend.inventory.entity.InventoryItem;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
class InventoryItemServiceTest {

    @Autowired
    private InventoryItemService inventoryItemService;

    @Test
    void createsActiveItem() {
        InventoryItem item = inventoryItemService.create(InventoryItem.builder()
            .code("SP-001")
            .name("Filtro de aceite")
            .unit("ud")
            .minimumStock(5.0)
            .currentStock(10.0)
            .build());

        assertNotNull(item.getId());
        assertEquals(Boolean.TRUE, item.getActive());
        assertEquals(5.0, item.getMinimumStock());
        assertEquals(10.0, item.getCurrentStock());
    }

    @Test
    void rejectsDuplicateCode() {
        inventoryItemService.create(InventoryItem.builder().code("DUP-ITEM").name("First").build());

        assertThrows(IllegalArgumentException.class, () -> inventoryItemService.create(
            InventoryItem.builder().code("dup-item").name("Second").build()
        ));
    }

    @Test
    void createWithClientIdIsIdempotent() {
        InventoryItem first = inventoryItemService.create(InventoryItem.builder()
            .code("SYNC-ITEM")
            .name("Sync item")
            .clientId("client-item-001")
            .build());

        InventoryItem second = inventoryItemService.create(InventoryItem.builder()
            .code("SYNC-ITEM")
            .name("Sync item")
            .clientId("client-item-001")
            .build());

        assertEquals(first.getId(), second.getId());
    }
}
