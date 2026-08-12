package com.gmao.backend.workorders.service;

import com.gmao.backend.workorders.entity.WorkOrder;
import com.gmao.backend.workorders.entity.WorkOrderStatus;
import com.gmao.backend.workorders.repository.WorkOrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;

    public WorkOrderService(WorkOrderRepository workOrderRepository) {
        this.workOrderRepository = workOrderRepository;
    }

    public WorkOrder create(WorkOrder workOrder) {
        if (workOrder.getClientId() != null && !workOrder.getClientId().isBlank()) {
            return workOrderRepository.findByClientId(workOrder.getClientId())
                .orElseGet(() -> {
                    workOrder.setStatus(WorkOrderStatus.OPEN);
                    return workOrderRepository.save(workOrder);
                });
        }
        workOrder.setStatus(WorkOrderStatus.OPEN);
        return workOrderRepository.save(workOrder);
    }

    public List<WorkOrder> list() {
        return workOrderRepository.findAll();
    }

    public Optional<WorkOrder> get(Long id) {
        return workOrderRepository.findById(id);
    }

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
        return workOrderRepository.save(existing);
    }

    public void delete(Long id) {
        workOrderRepository.deleteById(id);
    }

    public List<WorkOrder> findByStatus(WorkOrderStatus status) {
        return workOrderRepository.findByStatus(status);
    }

    public List<WorkOrder> findByAssignedTo(Long techId) {
        return workOrderRepository.findByAssignedTo(techId);
    }
}
