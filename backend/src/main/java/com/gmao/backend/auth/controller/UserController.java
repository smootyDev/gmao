package com.gmao.backend.auth.controller;

import com.gmao.backend.auth.dto.UserRequest;
import com.gmao.backend.auth.dto.UserResponse;
import com.gmao.backend.auth.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) { this.userService = userService; }

    @GetMapping
    public ResponseEntity<List<UserResponse>> list() { return ResponseEntity.ok(userService.list()); }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> get(@PathVariable Long id) { return ResponseEntity.ok(userService.get(id)); }

    @PostMapping
    public ResponseEntity<UserResponse> create(@RequestBody UserRequest request) { return ResponseEntity.ok(userService.create(request)); }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(@PathVariable Long id, @RequestBody UserRequest request) { return ResponseEntity.ok(userService.update(id, request)); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) { userService.delete(id); return ResponseEntity.noContent().build(); }
}
