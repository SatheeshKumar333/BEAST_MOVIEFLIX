package com.beastmovieflix.repository;

import com.beastmovieflix.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * User Repository - Database operations for User entity
 * 
 * @author Satheesh Kumar
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    // Admin methods
    Page<User> findByUsernameContainingIgnoreCase(String username, Pageable pageable);

    // Search methods
    List<User> findTop10ByUsernameContainingIgnoreCase(String username);

    long countByEmailVerifiedTrue();

    long countByRole(User.Role role);

    List<User> findTop5ByOrderByCreatedAtDesc();
}
