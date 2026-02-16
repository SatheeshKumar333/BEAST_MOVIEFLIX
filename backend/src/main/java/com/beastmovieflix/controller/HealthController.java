package com.beastmovieflix.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Health Controller - API health check endpoint
 * 
 * @author Satheesh Kumar
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Beast MovieFlix Backend");
        response.put("timestamp", LocalDateTime.now());
        response.put("developer", "Satheesh Kumar");
        return ResponseEntity.ok(response);
    }
}
