package com.beastmovieflix.config;

import com.beastmovieflix.entity.MovieLog;
import com.beastmovieflix.entity.User;
import com.beastmovieflix.repository.MovieLogRepository;
import com.beastmovieflix.repository.UserRepository;
import com.beastmovieflix.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Scheduled Tasks - Monthly activity reports and other scheduled jobs
 * 
 * @author Satheesh Kumar
 */
@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final UserRepository userRepository;
    private final MovieLogRepository movieLogRepository;
    private final EmailService emailService;

    /**
     * Send monthly activity reports on the 1st of every month at 9:00 AM
     * Cron: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 0 9 1 * ?")
    public void sendMonthlyActivityReports() {
        log.info("Starting monthly activity report job...");

        // Get previous month
        YearMonth previousMonth = YearMonth.now().minusMonths(1);
        LocalDateTime startOfMonth = previousMonth.atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = previousMonth.atEndOfMonth().atTime(23, 59, 59);
        String monthYear = previousMonth.format(DateTimeFormatter.ofPattern("MMMM yyyy"));

        // Get all verified users
        List<User> users = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getEmailVerified()))
                .toList();

        int sentCount = 0;
        int failedCount = 0;

        for (User user : users) {
            try {
                // Get user's logs for the previous month
                List<MovieLog> logs = movieLogRepository.findByUserIdOrderByWatchDateDesc(user.getId())
                        .stream()
                        .filter(log -> log.getWatchDate() != null &&
                                log.getWatchDate().isAfter(startOfMonth) &&
                                log.getWatchDate().isBefore(endOfMonth))
                        .toList();

                // Send report email
                emailService.sendMonthlyReport(user, logs, monthYear);
                sentCount++;
                log.debug("Sent monthly report to: {}", user.getEmail());
            } catch (Exception e) {
                failedCount++;
                log.error("Failed to send report to {}: {}", user.getEmail(), e.getMessage());
            }
        }

        log.info("Monthly report job completed. Sent: {}, Failed: {}", sentCount, failedCount);
    }

    /**
     * Cleanup expired OTPs daily at midnight
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void cleanupExpiredOtps() {
        log.info("Starting OTP cleanup job...");

        List<User> usersWithExpiredOtp = userRepository.findAll().stream()
                .filter(u -> u.getOtp() != null && u.getOtpExpiry() != null &&
                        LocalDateTime.now().isAfter(u.getOtpExpiry()))
                .toList();

        for (User user : usersWithExpiredOtp) {
            user.setOtp(null);
            user.setOtpExpiry(null);
            userRepository.save(user);
        }

        log.info("Cleaned up {} expired OTPs", usersWithExpiredOtp.size());
    }
}
