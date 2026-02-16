package com.beastmovieflix;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

/**
 * Beast MovieFlix Backend Application
 * Spring Boot REST API for movie logging and management
 * 
 * @author Satheesh Kumar
 */
@SpringBootApplication(exclude = { UserDetailsServiceAutoConfiguration.class })
public class BeastMovieFlixApplication {

    public static void main(String[] args) {
        SpringApplication.run(BeastMovieFlixApplication.class, args);
        System.out.println("🎬 Beast MovieFlix Backend Started Successfully!");
        System.out.println("📍 Server running on: http://localhost:8080");
    }
}
