package com.gmao.backend.workorders.controller;

import com.gmao.backend.workorders.entity.WorkOrder;
import com.gmao.backend.workorders.entity.WorkOrderStatus;
import com.gmao.backend.workorders.service.WorkOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workorders")
@CrossOrigin(origins = "*")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    public WorkOrderController(WorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }

    @PostMapping
    public ResponseEntity<WorkOrder> create(@RequestBody WorkOrder workOrder) {
        return ResponseEntity.ok(workOrderService.create(workOrder));
    }

    @GetMapping
    public ResponseEntity<List<WorkOrder>> list(
        @RequestParam(required = false) WorkOrderStatus status,
        @RequestParam(required = false) Long assignedTo) {

        if (status != null && assignedTo != null) {
            return ResponseEntity.ok(workOrderService.findByStatus(status).stream()
                .filter(w -> assignedTo.equals(w.getAssignedTo()))
                .toList());
        }
        if (status != null) {
            return ResponseEntity.ok(workOrderService.findByStatus(status));
        }
        if (assignedTo != null) {
            return ResponseEntity.ok(workOrderService.findByAssignedTo(assignedTo));
        }
        return ResponseEntity.ok(workOrderService.list());
    }

    @GetMapping("/by-inventory-item/{itemId}")
    public ResponseEntity<List<WorkOrder>> listByInventoryItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(workOrderService.findByInventoryItem(itemId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrder> get(@PathVariable Long id) {
        return workOrderService.get(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkOrder> update(@PathVariable Long id, @RequestBody WorkOrder workOrder) {
        return ResponseEntity.ok(workOrderService.update(id, workOrder));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        workOrderService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
