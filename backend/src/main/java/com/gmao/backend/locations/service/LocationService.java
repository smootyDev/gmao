package com.gmao.backend.locations.service;

import com.gmao.backend.locations.entity.Location;
import com.gmao.backend.locations.repository.LocationRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LocationService {

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    public Location create(Location location) {
        if (Boolean.TRUE.equals(location.getSystemRoot())) {
            throw new IllegalArgumentException("La localización raíz está protegida");
        }
        validate(location, null);
        if (locationRepository.findByCodeIgnoreCase(location.getCode()).isPresent()) {
            throw new IllegalArgumentException("El código de localización ya existe");
        }
        if (location.getActive() == null) {
            location.setActive(true);
        }
        location.setSystemRoot(false);
        location.setParentId(normalizeParentId(location.getParentId()));
        return locationRepository.save(location);
    }

    public List<Location> list() {
        return locationRepository.findAllByOrderByNameAsc();
    }

    public Optional<Location> get(Long id) {
        return locationRepository.findById(id);
    }

    public Location update(Long id, Location location) {
        Location existing = locationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Localización no encontrada"));

        if (Boolean.TRUE.equals(existing.getSystemRoot())) {
            throw new IllegalArgumentException("La localización raíz no se puede modificar");
        }

        validate(location, id);
        locationRepository.findByCodeIgnoreCase(location.getCode())
            .filter(found -> !found.getId().equals(id))
            .ifPresent(found -> { throw new IllegalArgumentException("El código de localización ya existe"); });

        existing.setCode(location.getCode());
        existing.setName(location.getName());
        existing.setDescription(location.getDescription());
        existing.setParentId(location.getParentId());
        existing.setActive(location.getActive() == null || location.getActive());
        existing.setParentId(normalizeParentId(existing.getParentId()));
        existing.setSystemRoot(false);
        return locationRepository.save(existing);
    }

    public void delete(Long id) {
        if (!locationRepository.existsById(id)) {
            throw new IllegalArgumentException("Localización no encontrada");
        }
        if (locationRepository.findById(id).map(Location::getSystemRoot).orElse(false)) {
            throw new IllegalArgumentException("La localización raíz no se puede eliminar");
        }
        try {
            locationRepository.deleteById(id);
            locationRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("No se puede eliminar una localización en uso");
        }
    }

    private void validate(Location location, Long currentId) {
        if (location.getCode() == null || location.getCode().isBlank()) {
            throw new IllegalArgumentException("El código es obligatorio");
        }
        if (location.getName() == null || location.getName().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (location.getParentId() == null) {
            return;
        }
        if (currentId != null && currentId.equals(location.getParentId())) {
            throw new IllegalArgumentException("Una localización no puede ser su propio padre");
        }
        if (!locationRepository.existsById(location.getParentId())) {
            throw new IllegalArgumentException("La localización padre no existe");
        }

        Long parentId = location.getParentId();
        while (parentId != null) {
            if (currentId != null && currentId.equals(parentId)) {
                throw new IllegalArgumentException("La jerarquía contiene un ciclo");
            }
            parentId = locationRepository.findById(parentId)
                .map(Location::getParentId)
                .orElse(null);
        }
    }

    private Long normalizeParentId(Long parentId) {
        if (parentId != null) {
            return parentId;
        }
        return locationRepository.findBySystemRootTrue()
            .map(Location::getId)
            .orElseThrow(() -> new IllegalStateException("No existe la localización raíz"));
    }
}
