package com.gmao.backend.locations.repository;

import com.gmao.backend.locations.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LocationRepository extends JpaRepository<Location, Long> {

    Optional<Location> findByCodeIgnoreCase(String code);

    Optional<Location> findBySystemRootTrue();

    List<Location> findAllByOrderByNameAsc();
}
