package com.gmao.backend.auth.service;

import com.gmao.backend.auth.dto.UserRequest;
import com.gmao.backend.auth.dto.UserResponse;
import com.gmao.backend.auth.entity.User;
import com.gmao.backend.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponse> list() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    public UserResponse get(Long id) {
        return toResponse(userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado")));
    }

    public UserResponse create(UserRequest request) {
        if (request.clientId() != null && !request.clientId().isBlank()) {
            return userRepository.findByClientId(request.clientId())
                .map(this::toResponse)
                .orElseGet(() -> createInternal(request));
        }
        return createInternal(request);
    }

    private UserResponse createInternal(UserRequest request) {
        validate(request, null, true);
        User user = new User();
        apply(user, request, true);
        return toResponse(userRepository.save(user));
    }

    public UserResponse update(Long id, UserRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        validate(request, id, false);
        apply(user, request, false);
        return toResponse(userRepository.save(user));
    }

    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
        userRepository.deleteById(id);
    }

    private void validate(UserRequest request, Long currentId, boolean passwordRequired) {
        if (request.employeeCode() == null || request.employeeCode().isBlank() || request.username() == null || request.username().isBlank()
            || request.firstName() == null || request.firstName().isBlank() || request.lastName() == null || request.lastName().isBlank()
            || request.email() == null || request.email().isBlank() || request.role() == null) {
            throw new IllegalArgumentException("Los campos obligatorios del usuario no están completos");
        }
        if (passwordRequired && (request.password() == null || request.password().isBlank())) {
            throw new IllegalArgumentException("La contraseña es obligatoria");
        }
        userRepository.findByEmployeeCodeIgnoreCase(request.employeeCode())
            .filter(found -> currentId == null || !found.getId().equals(currentId))
            .ifPresent(found -> { throw new IllegalArgumentException("El código de empleado ya existe"); });
        userRepository.findByUsername(request.username())
            .filter(found -> currentId == null || !found.getId().equals(currentId))
            .ifPresent(found -> { throw new IllegalArgumentException("El usuario ya existe"); });
    }

    private void apply(User user, UserRequest request, boolean creating) {
        user.setClientId(request.clientId());
        user.setEmployeeCode(request.employeeCode());
        user.setUsername(request.username());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setDepartment(request.department());
        user.setRole(request.role());
        user.setActive(request.active() == null || request.active());
        if (creating || (request.password() != null && !request.password().isBlank())) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getClientId(), user.getEmployeeCode(), user.getUsername(), user.getFirstName(), user.getLastName(),
            user.getEmail(), user.getPhone(), user.getDepartment(), user.getRole(), user.getActive(), user.getCreatedAt());
    }
}
