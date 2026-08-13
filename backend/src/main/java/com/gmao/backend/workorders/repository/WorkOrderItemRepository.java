package com.gmao.backend.workorders.repository;

import com.gmao.backend.workorders.entity.WorkOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkOrderItemRepository extends JpaRepository<WorkOrderItem, Long> {

    List<WorkOrderItem> findByWorkOrderId(Long workOrderId);

    void deleteByWorkOrderId(Long workOrderId);

    List<WorkOrderItem> findByInventoryItemId(Long inventoryItemId);
}
