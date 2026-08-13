package com.gmao.backend.workorders.repository;

import com.gmao.backend.workorders.entity.WorkOrder;
import com.gmao.backend.workorders.entity.WorkOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
    List<WorkOrder> findByStatus(WorkOrderStatus status);
    List<WorkOrder> findByAssignedTo(Long assignedTo);
    List<WorkOrder> findByStatusAndAssignedTo(WorkOrderStatus status, Long assignedTo);
    Optional<WorkOrder> findByClientId(String clientId);
    List<WorkOrder> findByItems_InventoryItemId(Long inventoryItemId);
    List<WorkOrder> findByPreventivePlanId(Long preventivePlanId);
    long countByPreventivePlanId(Long preventivePlanId);
}
