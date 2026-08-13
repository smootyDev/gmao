package com.gmao.backend.preventive.controller;

import com.gmao.backend.preventive.entity.PreventivePlan;
import com.gmao.backend.preventive.service.PreventivePlanService;
import com.gmao.backend.workorders.entity.WorkOrder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/preventive-plans")
@CrossOrigin(origins = "*")
public class PreventivePlanController {

    private final PreventivePlanService preventivePlanService;

    public PreventivePlanController(PreventivePlanService preventivePlanService) {
        this.preventivePlanService = preventivePlanService;
    }

    @PostMapping
    public ResponseEntity<PreventivePlan> create(@RequestBody PreventivePlan plan) {
        return ResponseEntity.ok(preventivePlanService.create(plan));
    }

    @GetMapping
    public ResponseEntity<List<PreventivePlan>> list() {
        return ResponseEntity.ok(preventivePlanService.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PreventivePlan> get(@PathVariable Long id) {
        return preventivePlanService.get(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<PreventivePlan> update(@PathVariable Long id, @RequestBody PreventivePlan plan) {
        return ResponseEntity.ok(preventivePlanService.update(id, plan));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        preventivePlanService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<WorkOrder> run(@PathVariable Long id) {
        return ResponseEntity.ok(preventivePlanService.generateWorkOrder(id));
    }
}
