
package com.gmao.backend.auth.repository;

import com.gmao.backend.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmployeeCodeIgnoreCase(String employeeCode);
}
