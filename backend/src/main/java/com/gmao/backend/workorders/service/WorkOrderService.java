package com.gmao.backend.workorders.service;

import com.gmao.backend.workorders.entity.WorkOrder;
import com.gmao.backend.workorders.entity.WorkOrderItem;
import com.gmao.backend.workorders.entity.WorkOrderStatus;
import com.gmao.backend.workorders.repository.WorkOrderItemRepository;
import com.gmao.backend.workorders.repository.WorkOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderItemRepository workOrderItemRepository;

    public WorkOrderService(WorkOrderRepository workOrderRepository,
                            WorkOrderItemRepository workOrderItemRepository) {
        this.workOrderRepository = workOrderRepository;
        this.workOrderItemRepository = workOrderItemRepository;
    }

    @Transactional
    public WorkOrder create(WorkOrder workOrder) {
        if (workOrder.getClientId() != null && !workOrder.getClientId().isBlank()) {
            Optional<WorkOrder> existing = workOrderRepository.findByClientId(workOrder.getClientId());
            if (existing.isPresent()) {
                return attachItems(existing.get());
            }
        }
        workOrder.setStatus(WorkOrderStatus.OPEN);
        WorkOrder saved = workOrderRepository.save(workOrder);
        replaceItems(saved);
        return attachItems(saved);
    }

    public List<WorkOrder> list() {
        return workOrderRepository.findAll().stream()
            .map(this::attachItems)
            .toList();
    }

    public Optional<WorkOrder> get(Long id) {
        return workOrderRepository.findById(id).map(this::attachItems);
    }

    @Transactional
    public WorkOrder update(Long id, WorkOrder workOrder) {
        WorkOrder existing = workOrderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Orden de trabajo no encontrada"));
        existing.setTitle(workOrder.getTitle());
        existing.setDescription(workOrder.getDescription());
        existing.setStatus(workOrder.getStatus());
        existing.setPriority(workOrder.getPriority());
        existing.setAssetId(workOrder.getAssetId());
        existing.setAssignedTo(workOrder.getAssignedTo());
        existing.setEstimatedHours(workOrder.getEstimatedHours());
        if (workOrder.getPreventivePlanId() != null) {
            existing.setPreventivePlanId(workOrder.getPreventivePlanId());
        }
        WorkOrder saved = workOrderRepository.save(existing);
        replaceItems(saved);
        return attachItems(saved);
    }

    @Transactional
    public void delete(Long id) {
        workOrderItemRepository.deleteByWorkOrderId(id);
        workOrderRepository.deleteById(id);
    }

    public List<WorkOrder> findByStatus(WorkOrderStatus status) {
        return workOrderRepository.findByStatus(status).stream()
            .map(this::attachItems)
            .toList();
    }

    public List<WorkOrder> findByAssignedTo(Long techId) {
        return workOrderRepository.findByAssignedTo(techId).stream()
            .map(this::attachItems)
            .toList();
    }

    public List<WorkOrder> findByInventoryItem(Long inventoryItemId) {
        List<Long> workOrderIds = workOrderItemRepository.findByInventoryItemId(inventoryItemId).stream()
            .map(WorkOrderItem::getWorkOrderId)
            .distinct()
            .toList();
        return workOrderRepository.findAllById(workOrderIds).stream()
            .map(this::attachItems)
            .toList();
    }

    private void replaceItems(WorkOrder workOrder) {
        workOrderItemRepository.deleteByWorkOrderId(workOrder.getId());
        if (workOrder.getItems() != null) {
            for (WorkOrderItem item : workOrder.getItems()) {
                item.setId(null);
                item.setWorkOrderId(workOrder.getId());
                workOrderItemRepository.save(item);
            }
        }
    }

    private WorkOrder attachItems(WorkOrder workOrder) {
        workOrder.setItems(workOrderItemRepository.findByWorkOrderId(workOrder.getId()));
        return workOrder;
    }
}
