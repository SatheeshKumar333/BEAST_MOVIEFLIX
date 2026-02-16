package com.beastmovieflix.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * DTOs for Authentication
 * 
 * @author Satheesh Kumar
 */
public class AuthDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterRequest {
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 10, message = "Username must be 3-10 characters")
        private String username;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).{8,}$", message = "Password must be 8+ chars with at least 1 uppercase letter and 1 number")
        private String password;
    }

    @Data
    @Builder
    public static class LoginRequest {
        @NotBlank(message = "Username or email is required")
        @com.fasterxml.jackson.annotation.JsonProperty("usernameOrEmail")
        private String usernameOrEmail;

        @NotBlank(message = "Password is required")
        @com.fasterxml.jackson.annotation.JsonProperty("password")
        private String password;

        public LoginRequest() {
        }

        public LoginRequest(String usernameOrEmail, String password) {
            this.usernameOrEmail = usernameOrEmail;
            this.password = password;
        }

        public String getUsernameOrEmail() {
            return usernameOrEmail;
        }

        public void setUsernameOrEmail(String usernameOrEmail) {
            this.usernameOrEmail = usernameOrEmail;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthResponse {
        private String token;
        @Builder.Default
        private String type = "Bearer";
        private Long userId;
        private String username;
        private String email;
        private String message;
        private boolean emailVerified;
        private boolean requiresOtp;
        private String role;
        private String profilePicture;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerifyOtpRequest {
        @NotBlank(message = "Email is required")
        @Email
        private String email;

        @NotBlank(message = "OTP is required")
        @Size(min = 6, max = 6, message = "OTP must be 6 digits")
        private String otp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResendOtpRequest {
        @NotBlank(message = "Email is required")
        @Email
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserProfileDTO {
        private Long id;
        private String username;
        private String email;
        private String bio;
        private String profilePicture;
        private int movieLogsCount;
        private int followersCount;
        private int followingCount;
        private boolean emailVerified;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateProfileRequest {
        @Size(min = 3, max = 10, message = "Username must be 3-10 characters")
        private String username;

        @Email
        private String email;

        @Size(max = 250)
        private String bio;

        @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).{8,}$", message = "Password must be 8+ chars with at least 1 uppercase letter and 1 number")
        private String newPassword;

        private String profilePicture;

        // Added to match frontend payload
        private String favourites;
    }
}
