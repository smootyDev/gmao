package com.gmao.backend.workorders.service;

import com.gmao.backend.workorders.entity.WorkOrder;
import com.gmao.backend.workorders.entity.WorkOrderItem;
import com.gmao.backend.workorders.entity.WorkOrderStatus;
import com.gmao.backend.workorders.repository.WorkOrderRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class WorkOrderServiceTest {

    @Autowired
    private WorkOrderService workOrderService;

    @Autowired
    private WorkOrderRepository workOrderRepository;

    @Test
    void createWorkOrderSetsOpen() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setTitle("Test order");
        workOrder.setDescription("Test description");

        WorkOrder saved = workOrderService.create(workOrder);

        assertNotNull(saved.getId());
        assertEquals(WorkOrderStatus.OPEN, saved.getStatus());
    }

    @Test
    void listWorkOrdersReturnsCreatedOrders() {
        workOrderRepository.deleteAll();

        WorkOrder w1 = new WorkOrder();
        w1.setTitle("Order 1");
        workOrderService.create(w1);

        WorkOrder w2 = new WorkOrder();
        w2.setTitle("Order 2");
        workOrderService.create(w2);

        List<WorkOrder> orders = workOrderService.list();

        assertEquals(2, orders.size());
    }

    @Test
    void createWithClientIdIsIdempotent() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setTitle("Sync order");
        workOrder.setClientId("client-wo-001");

        WorkOrder first = workOrderService.create(workOrder);
        WorkOrder second = workOrderService.create(workOrder);

        assertEquals(first.getId(), second.getId());
        long count = workOrderRepository.findAll().stream()
            .filter(w -> "client-wo-001".equals(w.getClientId()))
            .count();
        assertEquals(1, count);
    }

    @Test
    void createWorkOrderPersistsItems() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setTitle("Order with items");
        workOrder.setItems(List.of(
            WorkOrderItem.builder().inventoryItemId(1L).quantity(2.0).build(),
            WorkOrderItem.builder().inventoryItemId(2L).quantity(1.0).build()
        ));

        WorkOrder saved = workOrderService.create(workOrder);
        WorkOrder fetched = workOrderService.get(saved.getId()).orElseThrow();

        assertEquals(2, fetched.getItems().size());
        assertTrue(fetched.getItems().stream().allMatch(item -> item.getWorkOrderId() != null));
    }

    @Test
    void findWorkOrdersByInventoryItem() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setTitle("Uses item 42");
        workOrder.setItems(List.of(
            WorkOrderItem.builder().inventoryItemId(42L).quantity(3.0).build()
        ));
        WorkOrder saved = workOrderService.create(workOrder);

        List<WorkOrder> matches = workOrderService.findByInventoryItem(42L);

        assertTrue(matches.stream().anyMatch(w -> w.getId().equals(saved.getId())));
    }
}
