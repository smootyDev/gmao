package com.gmao.backend.ai.chat.service;

import com.gmao.backend.assets.entity.Asset;
import com.gmao.backend.assets.repository.AssetRepository;
import com.gmao.backend.preventive.entity.PreventivePlan;
import com.gmao.backend.preventive.repository.PreventivePlanRepository;
import com.gmao.backend.workorders.entity.WorkOrder;
import com.gmao.backend.workorders.entity.WorkOrderStatus;
import com.gmao.backend.workorders.repository.WorkOrderRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class AiContextBuilder {

    private static final int MAX_WORK_ORDERS = 20;
    private static final int MAX_ASSETS = 20;
    private static final int MAX_PLANS = 10;
    private static final int MAX_DESC = 120;

    private final WorkOrderRepository workOrderRepository;
    private final AssetRepository assetRepository;
    private final PreventivePlanRepository preventivePlanRepository;

    public AiContextBuilder(WorkOrderRepository workOrderRepository,
                            AssetRepository assetRepository,
                            PreventivePlanRepository preventivePlanRepository) {
        this.workOrderRepository = workOrderRepository;
        this.assetRepository = assetRepository;
        this.preventivePlanRepository = preventivePlanRepository;
    }

    public String buildWorkOrdersContext() {
        Map<Long, String> assetNames = assetNames();
        return workOrderRepository.findAll().stream()
            .limit(MAX_WORK_ORDERS)
            .map(wo -> "OT#" + wo.getId()
                + " | " + safe(wo.getTitle())
                + " | estado=" + wo.getStatus()
                + " | prioridad=" + wo.getPriority()
                + " | activo=" + assetNames.getOrDefault(wo.getAssetId(), "-")
                + " | horas=" + wo.getEstimatedHours()
                + " | desc=" + truncate(wo.getDescription()))
            .collect(Collectors.joining("\n"));
    }

    public String buildAssetsContext() {
        Map<Long, String> typeNames = Map.of();
        return assetRepository.findAll().stream()
            .limit(MAX_ASSETS)
            .map(asset -> "Activo#" + asset.getId()
                + " | " + safe(asset.getName())
                + " | criticidad=" + safe(asset.getCriticality())
                + " | estado=" + safe(asset.getStatus())
                + " | tipo=" + typeNames.getOrDefault(asset.getTypeId(), "-")
                + " | desc=" + truncate(asset.getDescription()))
            .collect(Collectors.joining("\n"));
    }

    public String buildPreventiveContext() {
        return preventivePlanRepository.findAllByOrderByNameAsc().stream()
            .limit(MAX_PLANS)
            .map(plan -> "Plan#" + plan.getId()
                + " | " + safe(plan.getName())
                + " | frecuencia(dias)=" + plan.getFrequencyDays()
                + " | activo=" + plan.getAssetId()
                + " | nextDue=" + plan.getNextDueDate()
                + " | desc=" + truncate(plan.getDescription()))
            .collect(Collectors.joining("\n"));
    }

    public String buildSummaryContext(Instant from, Instant to) {
        List<WorkOrder> all = workOrderRepository.findAll();
        List<WorkOrder> filtered = all.stream()
            .filter(wo -> (from == null || !wo.getCreatedAt().isBefore(from))
                && (to == null || !wo.getCreatedAt().isAfter(to)))
            .toList();
        long open = filtered.stream().filter(wo -> wo.getStatus() == WorkOrderStatus.OPEN
            || wo.getStatus() == WorkOrderStatus.ASSIGNED || wo.getStatus() == WorkOrderStatus.IN_PROGRESS).count();
        long closed = filtered.stream().filter(wo -> wo.getStatus() == WorkOrderStatus.CLOSED).count();
        Map<Integer, Long> byPriority = filtered.stream()
            .collect(Collectors.groupingBy(wo -> wo.getPriority() == null ? 0 : wo.getPriority(), Collectors.counting()));
        return "Total OTs en rango=" + filtered.size()
            + "\nAbiertas=" + open
            + "\nCerradas=" + closed
            + "\nPor prioridad=" + byPriority
            + "\nDetalle:\n" + filtered.stream()
                .limit(MAX_WORK_ORDERS)
                .map(wo -> "OT#" + wo.getId() + " " + safe(wo.getTitle())
                    + " (" + wo.getStatus() + ", p" + wo.getPriority() + ")")
                .collect(Collectors.joining("\n"));
    }

    private Map<Long, String> assetNames() {
        return assetRepository.findAll().stream()
            .collect(Collectors.toMap(Asset::getId, Asset::getName, (a, b) -> a));
    }

    private String truncate(String value) {
        if (value == null) {
            return "-";
        }
        String single = value.replaceAll("\\s+", " ").trim();
        return single.length() <= MAX_DESC ? single : single.substring(0, MAX_DESC) + "...";
    }

    private String safe(String value) {
        return value == null ? "-" : value;
    }
}