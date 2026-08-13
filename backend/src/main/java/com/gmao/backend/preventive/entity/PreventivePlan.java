package com.gmao.backend.preventive.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "preventive_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreventivePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "asset_id", nullable = false)
    private Long assetId;

    @Column(name = "frequency_days", nullable = false)
    private Integer frequencyDays;

    @Column(name = "last_run_at")
    private Instant lastRunAt;

    @Column(name = "next_due_date")
    private LocalDate nextDueDate;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "client_id", length = 36)
    private String clientId;

    @Transient
    private Long workOrderCount;
}
