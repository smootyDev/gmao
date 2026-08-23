package com.gmao.backend.auth.controller;

import com.gmao.backend.auth.dto.LoginRequest;
import com.gmao.backend.auth.dto.LoginResponse;
import com.gmao.backend.auth.entity.User;
import com.gmao.backend.auth.jwt.JwtProvider;
import com.gmao.backend.auth.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtProvider jwtProvider,
                          UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtProvider = jwtProvider;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.username(),
                loginRequest.password()
            )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = jwtProvider.generateToken(authentication);

        String role = authentication.getAuthorities().stream()
            .findFirst()
            .map(grantedAuthority -> grantedAuthority.getAuthority().replace("ROLE_", ""))
            .orElse("");

        Long userId = userRepository.findByUsername(authentication.getName())
            .map(User::getId)
            .orElse(null);

        return ResponseEntity.ok(new LoginResponse(userId, token, "Bearer", authentication.getName(), role));
    }
}
