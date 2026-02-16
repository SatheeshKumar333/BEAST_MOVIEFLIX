package com.beastmovieflix.service;

import com.beastmovieflix.entity.MovieLog;
import com.beastmovieflix.entity.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

/**
 * Email Service - Handle OTP and notification emails
 * 
 * @author Satheesh Kumar
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from:noreply@beastmovieflix.com}")
    private String fromEmail;

    @Value("${app.email.otp-expiry-minutes:10}")
    private int otpExpiryMinutes;

    /**
     * Generate a 6-digit OTP
     */
    public String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    /**
     * Get OTP expiry time
     */
    public LocalDateTime getOtpExpiry() {
        return LocalDateTime.now().plusMinutes(otpExpiryMinutes);
    }

    /**
     * Send OTP verification email
     */
    public void sendOtpEmail(String to, String username, String otp) {
        String subject = "🔐 Beast MovieFlix - Verify Your Email";
        String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background: #020617; color: #f8fafc; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 16px; padding: 40px; }
                        .logo { text-align: center; font-size: 28px; font-weight: bold; color: #ef4444; margin-bottom: 30px; }
                        .otp-box { background: #020617; border: 2px solid #22d3ee; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }
                        .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #22d3ee; }
                        .message { color: #94a3b8; line-height: 1.6; }
                        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
                        .highlight { color: #facc15; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">🎬 Beast MovieFlix</div>
                        <p class="message">Hey <span class="highlight">%s</span>! 👋</p>
                        <p class="message">Welcome to Beast MovieFlix! Use the OTP below to verify your email and start your movie journey:</p>
                        <div class="otp-box">
                            <div class="otp-code">%s</div>
                        </div>
                        <p class="message">⏰ This OTP expires in <strong>%d minutes</strong>.</p>
                        <p class="message">If you didn't create an account, please ignore this email.</p>
                        <div class="footer">
                            <p>Developed by <strong>Satheesh Kumar</strong></p>
                            <p>© 2024 Beast MovieFlix. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(username, otp, otpExpiryMinutes);

        sendHtmlEmail(to, subject, htmlContent);
    }

    /**
     * Send monthly activity report email
     */
    public void sendMonthlyReport(User user, List<MovieLog> logs, String monthYear) {
        String subject = "📊 Beast MovieFlix - Your " + monthYear + " Activity Report";

        StringBuilder movieList = new StringBuilder();
        int totalRating = 0;

        for (MovieLog log : logs) {
            String emoji = getRatingEmoji(log.getRating());
            movieList.append(String.format(
                    "<tr><td style='padding:10px;border-bottom:1px solid #334155;'>%s</td>" +
                            "<td style='padding:10px;border-bottom:1px solid #334155;text-align:center;'>%s %d/10</td>"
                            +
                            "<td style='padding:10px;border-bottom:1px solid #334155;'>%s</td></tr>",
                    log.getMovie().getTitle(),
                    emoji,
                    log.getRating() != null ? log.getRating() : 0,
                    log.getWatchDate() != null ? log.getWatchDate().format(DateTimeFormatter.ofPattern("MMM dd"))
                            : "-"));
            totalRating += (log.getRating() != null ? log.getRating() : 0);
        }

        double avgRating = logs.isEmpty() ? 0 : (double) totalRating / logs.size();

        String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background: #020617; color: #f8fafc; margin: 0; padding: 20px; }
                        .container { max-width: 700px; margin: 0 auto; background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 16px; padding: 40px; }
                        .logo { text-align: center; font-size: 28px; font-weight: bold; color: #ef4444; margin-bottom: 30px; }
                        .stats { display: flex; justify-content: space-around; margin: 30px 0; }
                        .stat-box { background: #020617; border-radius: 12px; padding: 20px; text-align: center; flex: 1; margin: 0 10px; }
                        .stat-number { font-size: 32px; font-weight: bold; color: #22d3ee; }
                        .stat-label { color: #94a3b8; font-size: 14px; }
                        table { width: 100%%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #020617; color: #facc15; padding: 12px; text-align: left; }
                        .message { color: #94a3b8; line-height: 1.6; }
                        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
                        .highlight { color: #facc15; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">🎬 Beast MovieFlix</div>
                        <p class="message">Hey <span class="highlight">%s</span>! 👋</p>
                        <p class="message">Here's your movie activity summary for <strong>%s</strong>:</p>

                        <div class="stats">
                            <div class="stat-box">
                                <div class="stat-number">%d</div>
                                <div class="stat-label">Movies Watched</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-number">%.1f</div>
                                <div class="stat-label">Avg Rating</div>
                            </div>
                        </div>

                        %s

                        <p class="message" style="margin-top:30px;">Keep logging and enjoy your movie journey! 🍿</p>

                        <div class="footer">
                            <p>Developed by <strong>Satheesh Kumar</strong></p>
                            <p>© 2024 Beast MovieFlix. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(
                        user.getUsername(),
                        monthYear,
                        logs.size(),
                        avgRating,
                        logs.isEmpty() ? "<p class='message'>No movies logged this month. Start logging! 🎬</p>"
                                : "<table><tr><th>Movie</th><th>Rating</th><th>Watched</th></tr>" + movieList
                                        + "</table>");

        sendHtmlEmail(user.getEmail(), subject, htmlContent);
    }

    /**
     * Send HTML email
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    private String getRatingEmoji(Integer rating) {
        if (rating == null)
            return "⭐";
        String[] emojis = { "😡", "😕", "😐", "🙂", "😄", "🔥", "💥", "🤯", "👑", "🐺" };
        return rating >= 1 && rating <= 10 ? emojis[rating - 1] : "⭐";
    }
}
