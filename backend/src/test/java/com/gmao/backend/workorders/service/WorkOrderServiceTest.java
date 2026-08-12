package com.gmao.backend.workorders.service;

import com.gmao.backend.workorders.entity.WorkOrder;
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
}
