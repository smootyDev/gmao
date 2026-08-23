package com.gmao.backend.workorders.service;

import com.gmao.backend.auth.entity.Role;
import com.gmao.backend.auth.entity.User;
import com.gmao.backend.auth.repository.UserRepository;
import com.gmao.backend.security.SecurityUtils;
import com.gmao.backend.workorders.entity.WorkOrder;
import com.gmao.backend.workorders.entity.WorkOrderItem;
import com.gmao.backend.workorders.entity.WorkOrderStatus;
import com.gmao.backend.workorders.repository.WorkOrderItemRepository;
import com.gmao.backend.workorders.repository.WorkOrderRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderItemRepository workOrderItemRepository;
    private final SecurityUtils securityUtils;
    private final UserRepository userRepository;

    public WorkOrderService(WorkOrderRepository workOrderRepository,
                            WorkOrderItemRepository workOrderItemRepository,
                            SecurityUtils securityUtils,
                            UserRepository userRepository) {
        this.workOrderRepository = workOrderRepository;
        this.workOrderItemRepository = workOrderItemRepository;
        this.securityUtils = securityUtils;
        this.userRepository = userRepository;
    }

    @Transactional
    public WorkOrder create(WorkOrder workOrder) {
        if (workOrder.getClientId() != null && !workOrder.getClientId().isBlank()) {
            Optional<WorkOrder> existing = workOrderRepository.findByClientId(workOrder.getClientId());
            if (existing.isPresent()) {
                return attachItems(existing.get());
            }
        }
        validateAssignedUser(workOrder.getAssignedTo());
        workOrder.setStatus(WorkOrderStatus.OPEN);
        workOrder.setCreatedBy(securityUtils.currentUserId());
        WorkOrder saved = workOrderRepository.save(workOrder);
        replaceItems(saved);
        return attachItems(saved);
    }

    public List<WorkOrder> list() {
        if (securityUtils.isTech()) {
            return findByAssignedTo(securityUtils.currentUserId());
        }
        return workOrderRepository.findAll().stream()
            .map(this::attachItems)
            .toList();
    }

    public Optional<WorkOrder> get(Long id) {
        Optional<WorkOrder> workOrder = workOrderRepository.findById(id).map(this::attachItems);
        if (securityUtils.isTech() && workOrder.isPresent()
            && !securityUtils.isCurrentUser(workOrder.get().getAssignedTo())) {
            return Optional.empty();
        }
        return workOrder;
    }

    @Transactional
    public WorkOrder update(Long id, WorkOrder workOrder) {
        WorkOrder existing = workOrderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Orden de trabajo no encontrada"));
        existing.setItems(workOrderItemRepository.findByWorkOrderId(id));

        if (securityUtils.isTech()) {
            updateAsTech(existing, workOrder);
        } else {
            validateAssignedUser(workOrder.getAssignedTo());
            existing.setTitle(workOrder.getTitle());
            existing.setDescription(workOrder.getDescription());
            existing.setStatus(workOrder.getStatus());
            existing.setPriority(workOrder.getPriority());
            existing.setAssetId(workOrder.getAssetId());
            existing.setAssignedTo(workOrder.getAssignedTo());
            existing.setEstimatedHours(workOrder.getEstimatedHours());
            existing.setActualHours(workOrder.getActualHours());
            if (workOrder.getPreventivePlanId() != null) {
                existing.setPreventivePlanId(workOrder.getPreventivePlanId());
            }
            existing.setItems(workOrder.getItems());
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
        return restrictToTech(workOrderRepository.findByStatus(status));
    }

    public List<WorkOrder> findByAssignedTo(Long techId) {
        Long target = securityUtils.isTech() ? securityUtils.currentUserId() : techId;
        return workOrderRepository.findByAssignedTo(target).stream()
            .map(this::attachItems)
            .toList();
    }

    public List<WorkOrder> findByInventoryItem(Long inventoryItemId) {
        List<Long> workOrderIds = workOrderItemRepository.findByInventoryItemId(inventoryItemId).stream()
            .map(WorkOrderItem::getWorkOrderId)
            .distinct()
            .toList();
        return restrictToTech(workOrderRepository.findAllById(workOrderIds));
    }

    private void updateAsTech(WorkOrder existing, WorkOrder workOrder) {
        if (!securityUtils.isCurrentUser(existing.getAssignedTo())) {
            throw new AccessDeniedException("Solo puedes modificar órdenes de trabajo asignadas a ti");
        }
        if (workOrder.getPriority() != null && !Objects.equals(workOrder.getPriority(), existing.getPriority())
            || workOrder.getAssignedTo() != null
                && !Objects.equals(workOrder.getAssignedTo(), existing.getAssignedTo())) {
            throw new AccessDeniedException("No puedes cambiar la prioridad ni la asignación de la orden");
        }
        WorkOrderStatus next = workOrder.getStatus() != null ? workOrder.getStatus() : existing.getStatus();
        validateTechTransition(existing.getStatus(), next);
        existing.setStatus(next);
        if (workOrder.getDescription() != null) {
            existing.setDescription(workOrder.getDescription());
        }
        if (workOrder.getActualHours() != null) {
            existing.setActualHours(workOrder.getActualHours());
        }
    }

    private void validateTechTransition(WorkOrderStatus current, WorkOrderStatus next) {
        if (current == next) {
            return;
        }
        boolean allowed = switch (current) {
            case ASSIGNED -> next == WorkOrderStatus.IN_PROGRESS
                || next == WorkOrderStatus.ON_HOLD
                || next == WorkOrderStatus.CLOSED;
            case IN_PROGRESS -> next == WorkOrderStatus.ON_HOLD || next == WorkOrderStatus.CLOSED;
            case ON_HOLD -> next == WorkOrderStatus.IN_PROGRESS || next == WorkOrderStatus.CLOSED;
            default -> false;
        };
        if (!allowed) {
            throw new AccessDeniedException("Transición de estado no permitida desde " + current);
        }
    }

    private void validateAssignedUser(Long userId) {
        if (userId == null) {
            return;
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("El usuario asignado no existe"));
        if (user.getRole() != Role.TECH) {
            throw new IllegalArgumentException("El usuario asignado debe tener rol TÉCNICO");
        }
        if (!user.getActive()) {
            throw new IllegalArgumentException("El técnico asignado está inactivo");
        }
    }

    private List<WorkOrder> restrictToTech(List<WorkOrder> workOrders) {
        if (!securityUtils.isTech()) {
            return workOrders.stream().map(this::attachItems).toList();
        }
        Long techId = securityUtils.currentUserId();
        return workOrders.stream()
            .filter(w -> techId.equals(w.getAssignedTo()))
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