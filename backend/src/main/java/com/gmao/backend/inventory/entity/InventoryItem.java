package com.gmao.backend.inventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "inventory_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(length = 50)
    private String category;

    @Column(length = 20)
    private String unit;

    @Column(name = "minimum_stock", nullable = false)
    private Double minimumStock = 0.0;

    @Column(name = "current_stock", nullable = false)
    private Double currentStock = 0.0;

    @Column(name = "location_id")
    private Long locationId;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "client_id", length = 36)
    private String clientId;
}
