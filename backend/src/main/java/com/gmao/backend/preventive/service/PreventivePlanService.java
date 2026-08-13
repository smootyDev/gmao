package com.gmao.backend.preventive.service;

import com.gmao.backend.preventive.entity.PreventivePlan;
import com.gmao.backend.preventive.repository.PreventivePlanRepository;
import com.gmao.backend.workorders.entity.WorkOrder;
import com.gmao.backend.workorders.entity.WorkOrderStatus;
import com.gmao.backend.workorders.repository.WorkOrderRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PreventivePlanService {

    private final PreventivePlanRepository preventivePlanRepository;
    private final WorkOrderRepository workOrderRepository;

    public PreventivePlanService(PreventivePlanRepository preventivePlanRepository,
                                 WorkOrderRepository workOrderRepository) {
        this.preventivePlanRepository = preventivePlanRepository;
        this.workOrderRepository = workOrderRepository;
    }

    public PreventivePlan create(PreventivePlan plan) {
        if (plan.getClientId() != null && !plan.getClientId().isBlank()) {
            return preventivePlanRepository.findByClientId(plan.getClientId())
                .map(this::withCount)
                .orElseGet(() -> {
                    validate(plan);
                    plan.setActive(plan.getActive() == null || plan.getActive());
                    plan.setNextDueDate(LocalDate.now().plusDays(plan.getFrequencyDays()));
                    return withCount(preventivePlanRepository.save(plan));
                });
        }
        validate(plan);
        plan.setActive(plan.getActive() == null || plan.getActive());
        plan.setNextDueDate(LocalDate.now().plusDays(plan.getFrequencyDays()));
        return withCount(preventivePlanRepository.save(plan));
    }

    public List<PreventivePlan> list() {
        return preventivePlanRepository.findAllByOrderByNameAsc().stream()
            .map(this::withCount)
            .toList();
    }

    public Optional<PreventivePlan> get(Long id) {
        return preventivePlanRepository.findById(id).map(this::withCount);
    }

    public PreventivePlan update(Long id, PreventivePlan plan) {
        PreventivePlan existing = preventivePlanRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Plan preventivo no encontrado"));
        validate(plan);
        existing.setName(plan.getName());
        existing.setDescription(plan.getDescription());
        existing.setAssetId(plan.getAssetId());
        existing.setFrequencyDays(plan.getFrequencyDays());
        existing.setActive(plan.getActive() == null || plan.getActive());
        return withCount(preventivePlanRepository.save(existing));
    }

    public void delete(Long id) {
        if (!preventivePlanRepository.existsById(id)) {
            throw new IllegalArgumentException("Plan preventivo no encontrado");
        }
        try {
            preventivePlanRepository.deleteById(id);
            preventivePlanRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("No se puede eliminar un plan preventivo en uso");
        }
    }

    @Transactional
    public WorkOrder generateWorkOrder(Long planId) {
        PreventivePlan plan = preventivePlanRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan preventivo no encontrado"));

        WorkOrder workOrder = new WorkOrder();
        workOrder.setTitle("Preventivo: " + plan.getName());
        workOrder.setDescription(plan.getDescription());
        workOrder.setStatus(WorkOrderStatus.OPEN);
        workOrder.setPriority(3);
        workOrder.setAssetId(plan.getAssetId());
        workOrder.setPreventivePlanId(planId);
        WorkOrder saved = workOrderRepository.save(workOrder);

        plan.setLastRunAt(Instant.now());
        plan.setNextDueDate(LocalDate.now().plusDays(plan.getFrequencyDays()));
        preventivePlanRepository.save(plan);

        return saved;
    }

    public long getWorkOrderCount(Long planId) {
        return workOrderRepository.countByPreventivePlanId(planId);
    }

    private PreventivePlan withCount(PreventivePlan plan) {
        plan.setWorkOrderCount(getWorkOrderCount(plan.getId()));
        return plan;
    }

    private void validate(PreventivePlan plan) {
        if (plan.getName() == null || plan.getName().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (plan.getAssetId() == null) {
            throw new IllegalArgumentException("El activo es obligatorio");
        }
        if (plan.getFrequencyDays() == null || plan.getFrequencyDays() <= 0) {
            throw new IllegalArgumentException("La frecuencia debe ser mayor que 0");
        }
    }
}
