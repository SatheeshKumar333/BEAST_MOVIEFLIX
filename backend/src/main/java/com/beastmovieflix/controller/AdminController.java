package com.beastmovieflix.controller;

import com.beastmovieflix.entity.*;
import com.beastmovieflix.entity.Report.ReportStatus;
import com.beastmovieflix.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Admin Controller - Full Admin Dashboard API
 * 
 * @author Satheesh Kumar
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final MovieLogRepository movieLogRepository;
    private final ReportRepository reportRepository;
    private final SystemSettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;

    // ========== USER MANAGEMENT ==========

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> users;

        if (search != null && !search.isBlank()) {
            users = userRepository.findByUsernameContainingIgnoreCase(search, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        List<Map<String, Object>> userList = users.getContent().stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("email", u.getEmail());
            map.put("role", u.getRole().name());
            map.put("emailVerified", u.getEmailVerified());
            map.put("createdAt", u.getCreatedAt());
            map.put("logsCount", u.getMovieLogs() != null ? u.getMovieLogs().size() : 0);
            return map;
        }).toList();

        Map<String, Object> response = new HashMap<>();
        response.put("users", userList);
        response.put("totalPages", users.getTotalPages());
        response.put("totalElements", users.getTotalElements());
        response.put("currentPage", page);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        String action = body.get("action"); // activate, deactivate, block

        switch (action) {
            case "activate" -> user.setEmailVerified(true);
            case "deactivate" -> user.setEmailVerified(false);
            case "block" -> {
                user.setEmailVerified(false);
                user.setBio("[BLOCKED] " + (user.getBio() != null ? user.getBio() : ""));
            }
            case "unblock" -> {
                if (user.getBio() != null && user.getBio().startsWith("[BLOCKED]")) {
                    user.setBio(user.getBio().replace("[BLOCKED] ", ""));
                }
            }
            default -> {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid action"));
            }
        }

        userRepository.save(user);
        log.info("Admin action: {} on user {}", action, user.getUsername());

        return ResponseEntity.ok(Map.of("message", "User " + action + "d successfully"));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        String role = body.get("role");

        try {
            user.setRole(User.Role.valueOf(role.toUpperCase()));
            userRepository.save(user);
            log.info("Changed role of {} to {}", user.getUsername(), role);
            return ResponseEntity.ok(Map.of("message", "Role updated to " + role));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role"));
        }
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<?> forceResetPassword(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        String newPassword = "Reset@" + System.currentTimeMillis() % 10000;
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password reset for user: {}", user.getUsername());
        return ResponseEntity.ok(Map.of(
                "message", "Password reset successfully",
                "newPassword", newPassword));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }
        userRepository.deleteById(id);
        log.info("Deleted user with ID: {}", id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    // ========== CONTENT MODERATION ==========

    @GetMapping("/logs")
    public ResponseEntity<?> getAllLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("watchDate").descending());
        Page<MovieLog> logs = movieLogRepository.findAll(pageable);

        List<Map<String, Object>> logList = logs.getContent().stream().map(l -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", l.getId());
            map.put("title", l.getMovie().getTitle());
            map.put("rating", l.getRating());
            // map.put("review", l.getReview()); // Review is now separate
            map.put("watchedAt", l.getWatchDate());
            map.put("username", l.getUser() != null ? l.getUser().getUsername() : "Unknown");
            map.put("userId", l.getUser() != null ? l.getUser().getId() : null);
            return map;
        }).toList();

        return ResponseEntity.ok(Map.of(
                "logs", logList,
                "totalPages", logs.getTotalPages(),
                "totalElements", logs.getTotalElements()));
    }

    @DeleteMapping("/logs/{id}")
    public ResponseEntity<?> deleteLog(@PathVariable Long id) {
        if (!movieLogRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Log not found"));
        }
        movieLogRepository.deleteById(id);
        log.info("Deleted movie log ID: {}", id);
        return ResponseEntity.ok(Map.of("message", "Log deleted successfully"));
    }

    @PutMapping("/logs/{id}")
    public ResponseEntity<?> editLog(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        Optional<MovieLog> logOpt = movieLogRepository.findById(id);
        if (logOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Log not found"));
        }

        MovieLog movieLog = logOpt.get();
        // Review editing removed as it's a separate entity now
        if (body.containsKey("rating")) {
            movieLog.setRating((Integer) body.get("rating"));
        }

        movieLogRepository.save(movieLog);
        return ResponseEntity.ok(Map.of("message", "Log updated successfully"));
    }

    // ========== REPORTS HANDLING ==========

    @GetMapping("/reports")
    public ResponseEntity<?> getReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "PENDING") String status) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        try {
            ReportStatus reportStatus = ReportStatus.valueOf(status.toUpperCase());
            Page<Report> reports = reportRepository.findByStatus(reportStatus, pageable);

            return ResponseEntity.ok(Map.of(
                    "reports", reports.getContent(),
                    "totalPages", reports.getTotalPages(),
                    "pendingCount", reportRepository.countByStatus(ReportStatus.PENDING)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status"));
        }
    }

    @PutMapping("/reports/{id}/action")
    public ResponseEntity<?> handleReport(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Optional<Report> reportOpt = reportRepository.findById(id);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Report not found"));
        }

        Report report = reportOpt.get();
        String action = body.get("action"); // resolve, dismiss, warn, ban
        String notes = body.get("notes");

        report.setStatus(action.equals("dismiss") ? ReportStatus.DISMISSED : ReportStatus.RESOLVED);
        report.setActionTaken(action + (notes != null ? ": " + notes : ""));
        report.setActionAt(LocalDateTime.now());

        reportRepository.save(report);
        log.info("Report {} handled with action: {}", id, action);

        return ResponseEntity.ok(Map.of("message", "Report handled successfully"));
    }

    // ========== ANALYTICS & STATS ==========

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // User stats
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByEmailVerifiedTrue();
        long adminCount = userRepository.countByRole(User.Role.ADMIN);

        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("adminCount", adminCount);

        // Content stats
        long totalLogs = movieLogRepository.count();
        stats.put("totalLogs", totalLogs);

        // Reports stats
        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);
        stats.put("pendingReports", pendingReports);

        // Recent activity
        List<User> recentUsers = userRepository.findTop5ByOrderByCreatedAtDesc();
        stats.put("recentUsers", recentUsers.stream().map(u -> Map.of(
                "username", u.getUsername(),
                "createdAt", u.getCreatedAt())).toList());

        return ResponseEntity.ok(stats);
    }

    // ========== SYSTEM SETTINGS ==========

    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        List<SystemSettings> settings = settingsRepository.findAll();
        Map<String, String> settingsMap = new HashMap<>();
        for (SystemSettings s : settings) {
            settingsMap.put(s.getSettingKey(), s.getSettingValue());
        }
        return ResponseEntity.ok(settingsMap);
    }

    @PutMapping("/settings")
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, String> settings) {
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            SystemSettings setting = settingsRepository.findBySettingKey(entry.getKey())
                    .orElse(SystemSettings.builder().settingKey(entry.getKey()).build());
            setting.setSettingValue(entry.getValue());
            settingsRepository.save(setting);
        }
        log.info("System settings updated");
        return ResponseEntity.ok(Map.of("message", "Settings updated successfully"));
    }

    // ========== DATA EXPORT ==========

    @GetMapping("/export/users")
    public ResponseEntity<?> exportUsers() {
        List<User> users = userRepository.findAll();
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Username,Email,Role,Verified,CreatedAt\n");

        for (User u : users) {
            csv.append(String.format("%d,%s,%s,%s,%s,%s\n",
                    u.getId(), u.getUsername(), u.getEmail(),
                    u.getRole(), u.getEmailVerified(), u.getCreatedAt()));
        }

        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=users_export.csv")
                .body(csv.toString());
    }

    @GetMapping("/export/logs")
    public ResponseEntity<?> exportLogs() {
        List<MovieLog> logs = movieLogRepository.findAll();
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Title,Rating,WatchedAt,Username\n");

        for (MovieLog l : logs) {
            csv.append(String.format("%d,\"%s\",%d,%s,%s\n",
                    l.getId(), l.getMovie().getTitle(), l.getRating(),
                    l.getWatchDate(), l.getUser() != null ? l.getUser().getUsername() : ""));
        }

        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=logs_export.csv")
                .body(csv.toString());
    }
}
