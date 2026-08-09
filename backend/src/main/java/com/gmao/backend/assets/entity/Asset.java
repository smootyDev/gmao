package com.gmao.backend.assets.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "assets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String type;

    private String criticality;

    private String status;

    private String location;

    @Column(name = "serial_number")
    private String serialNumber;

    @Column(name = "hours_of_use")
    private Double hoursOfUse;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;
}
