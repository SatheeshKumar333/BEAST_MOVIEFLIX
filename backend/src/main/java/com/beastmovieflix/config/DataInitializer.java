package com.beastmovieflix.config;

import com.beastmovieflix.entity.User;
import com.beastmovieflix.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Data Initializer - Creates admin account on startup
 * 
 * @author Satheesh Kumar
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        createAdminAccount();
    }

    private void createAdminAccount() {
        // Check if admin already exists
        if (userRepository.existsByUsername(adminUsername)) {
            log.info("Admin account already exists: {}", adminUsername);
            return;
        }

        // Create admin user
        User admin = User.builder()
                .username(adminUsername)
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .role(User.Role.ADMIN)
                .emailVerified(true) // Admin is pre-verified
                .bio("System Administrator")
                .build();

        // Ensure non-null before save
        java.util.Objects.requireNonNull(admin, "Admin user cannot be null");
        userRepository.save(admin);

        log.info("╔════════════════════════════════════════╗");
        log.info("║   ADMIN ACCOUNT CREATED SUCCESSFULLY   ║");
        log.info("╠════════════════════════════════════════╣");
        log.info("║ Username: {}                        ║", adminUsername);
        log.info("║ Email:    {}      ║", adminEmail);
        log.info("║ Password: ********                     ║");
        log.info("╚════════════════════════════════════════╝");
    }
}
