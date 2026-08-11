package com.gmao.backend.locations.service;

import com.gmao.backend.locations.entity.Location;
import com.gmao.backend.locations.repository.LocationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
class LocationServiceTest {

    @Autowired
    private LocationService locationService;

    @Autowired
    private LocationRepository locationRepository;

    @BeforeEach
    void ensureRootLocation() {
        if (locationRepository.findBySystemRootTrue().isEmpty()) {
            locationRepository.save(Location.builder()
                .code("EMPRESA")
                .name("Empresa")
                .systemRoot(true)
                .active(true)
                .build());
        }
    }

    @Test
    void createLocationDefaultsToActive() {
        Location location = Location.builder()
            .code("TEST-001")
            .name("Test location")
            .build();

        Location saved = locationService.create(location);

        assertNotNull(saved.getId());
        assertEquals(Boolean.TRUE, saved.getActive());
    }

    @Test
    void rejectsDuplicateCode() {
        Location first = Location.builder().code("DUP-001").name("First").build();
        locationService.create(first);

        Location duplicate = Location.builder().code("dup-001").name("Second").build();

        assertThrows(IllegalArgumentException.class, () -> locationService.create(duplicate));
    }

    @Test
    void rejectsSelfAsParent() {
        Location location = locationService.create(
            Location.builder().code("SELF-001").name("Self").build()
        );

        location.setParentId(location.getId());

        assertThrows(IllegalArgumentException.class, () -> locationService.update(location.getId(), location));
    }

    @Test
    void protectsRootLocation() {
        Location root = locationRepository.findBySystemRootTrue().orElseThrow();

        assertThrows(IllegalArgumentException.class, () -> locationService.update(root.getId(), root));
        assertThrows(IllegalArgumentException.class, () -> locationService.delete(root.getId()));
    }
}
