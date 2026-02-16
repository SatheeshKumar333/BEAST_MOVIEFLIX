package com.beastmovieflix.service;

import com.beastmovieflix.dto.AuthDTO.*;
import com.beastmovieflix.entity.User;
import com.beastmovieflix.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

/**
 * User Service - Business logic for user operations
 * 
 * @author Satheesh Kumar
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final com.beastmovieflix.repository.FollowerRepository followerRepository;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken!");
        }

        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered!");
        }

        // Validate password strength
        if (!isValidPassword(request.getPassword())) {
            throw new RuntimeException("Password must be 8+ chars with at least 1 uppercase letter and 1 number");
        }

        // Generate OTP
        String otp = emailService.generateOtp();
        LocalDateTime otpExpiry = emailService.getOtpExpiry();

        // Create new user (not verified yet)
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .emailVerified(false)
                .otp(otp)
                .otpExpiry(otpExpiry)
                .build();

        User savedUser = userRepository.save(user);

        // Send OTP email
        try {
            emailService.sendOtpEmail(savedUser.getEmail(), savedUser.getUsername(), otp);
        } catch (Exception e) {
            log.error("Failed to send OTP email: {}", e.getMessage());
        }

        return AuthResponse.builder()
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .message("Registration successful! Please verify your email with the OTP sent.")
                .emailVerified(false)
                .requiresOtp(true)
                .role(savedUser.getRole().name())
                .profilePicture(savedUser.getProfilePicture())
                .build();
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found!"));

        // Check if already verified
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new RuntimeException("Email already verified!");
        }

        // Check OTP expiry
        if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            throw new RuntimeException("OTP has expired! Please request a new one.");
        }

        // Verify OTP
        if (!request.getOtp().equals(user.getOtp())) {
            throw new RuntimeException("Invalid OTP!");
        }

        // Mark as verified and clear OTP
        user.setEmailVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        // Generate JWT token
        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .message("Email verified successfully! You can now login.")
                .emailVerified(true)
                .requiresOtp(false)
                .role(user.getRole().name())
                .profilePicture(user.getProfilePicture())
                .build();
    }

    @Transactional
    public AuthResponse resendOtp(ResendOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found!"));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new RuntimeException("Email already verified!");
        }

        // Generate new OTP
        String otp = emailService.generateOtp();
        LocalDateTime otpExpiry = emailService.getOtpExpiry();

        user.setOtp(otp);
        user.setOtpExpiry(otpExpiry);
        userRepository.save(user);

        // Send OTP email
        try {
            emailService.sendOtpEmail(user.getEmail(), user.getUsername(), otp);
        } catch (Exception e) {
            log.error("Failed to resend OTP email: {}", e.getMessage());
            throw new RuntimeException("Failed to send OTP email. Please try again.");
        }

        return AuthResponse.builder()
                .email(user.getEmail())
                .message("New OTP sent to your email!")
                .requiresOtp(true)
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // Find user by username or email
        User user = userRepository.findByUsername(request.getUsernameOrEmail())
                .orElseGet(() -> userRepository.findByEmail(request.getUsernameOrEmail())
                        .orElseThrow(() -> new RuntimeException("User not found!")));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password!");
        }

        // Check if email is verified
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            // Resend OTP automatically
            String otp = emailService.generateOtp();
            LocalDateTime otpExpiry = emailService.getOtpExpiry();
            user.setOtp(otp);
            user.setOtpExpiry(otpExpiry);
            userRepository.save(user);

            try {
                emailService.sendOtpEmail(user.getEmail(), user.getUsername(), otp);
            } catch (Exception e) {
                log.error("Failed to send OTP: {}", e.getMessage());
            }

            return AuthResponse.builder()
                    .email(user.getEmail())
                    .message("Email not verified! OTP has been sent to your email.")
                    .emailVerified(false)
                    .requiresOtp(true)
                    .build();
        }

        // Generate JWT token
        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .message("Login successful!")
                .emailVerified(true)
                .role(user.getRole().name())
                .profilePicture(user.getProfilePicture())
                .build();
    }

    @Transactional(readOnly = true)
    public UserProfileDTO getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        int followers = user.getFollowers() != null ? user.getFollowers().size() : 0;
        int following = user.getFollowing() != null ? user.getFollowing().size() : 0;

        return UserProfileDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .bio(user.getBio())
                .profilePicture(user.getProfilePicture())
                .movieLogsCount(user.getMovieLogs().size())
                .followersCount(followers)
                .followingCount(following)
                .emailVerified(Boolean.TRUE.equals(user.getEmailVerified()))
                .build();
    }

    @Transactional
    public UserProfileDTO updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new RuntimeException("Username already taken!");
            }
            user.setUsername(request.getUsername());
        }

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already registered!");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }

        if (request.getNewPassword() != null) {
            if (!isValidPassword(request.getNewPassword())) {
                throw new RuntimeException("Password must be 8+ chars with at least 1 uppercase letter and 1 number");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        if (request.getProfilePicture() != null && !request.getProfilePicture().isEmpty()) {
            user.setProfilePicture(request.getProfilePicture());
        }

        User updatedUser = userRepository.save(user);

        return getProfile(updatedUser.getId());
    }

    @Transactional(readOnly = true)
    public List<UserProfileDTO> searchUsers(String query) {
        List<User> users = userRepository.findTop10ByUsernameContainingIgnoreCase(query);
        return users.stream()
                .map(user -> UserProfileDTO.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .profilePicture(user.getProfilePicture()) // optimized: minimal fields
                        .build())
                .toList();
    }

    @Transactional
    public void followUser(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) {
            throw new RuntimeException("You cannot follow yourself!");
        }

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new RuntimeException("User not found!"));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new RuntimeException("User to follow not found!"));

        if (followerRepository.existsByFollowerUserAndFollowingUser(follower, following)) {
            throw new RuntimeException("Already following this user!");
        }

        com.beastmovieflix.entity.Follower follow = com.beastmovieflix.entity.Follower.builder()
                .followerUser(follower)
                .followingUser(following)
                .build();

        followerRepository.save(follow);
    }

    @Transactional
    public void unfollowUser(Long followerId, Long followingId) {
        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new RuntimeException("User not found!"));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new RuntimeException("User to unfollow not found!"));

        com.beastmovieflix.entity.Follower follow = followerRepository
                .findByFollowerUserAndFollowingUser(follower, following)
                .orElseThrow(() -> new RuntimeException("You are not following this user!"));

        followerRepository.delete(follow);
    }

    @Transactional(readOnly = true)
    public List<UserProfileDTO> getFollowers(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        return followerRepository.findByFollowingUser(user).stream()
                .map(f -> UserProfileDTO.builder()
                        .id(f.getFollowerUser().getId())
                        .username(f.getFollowerUser().getUsername())
                        .profilePicture(f.getFollowerUser().getProfilePicture())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserProfileDTO> getFollowing(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        return followerRepository.findByFollowerUser(user).stream()
                .map(f -> UserProfileDTO.builder()
                        .id(f.getFollowingUser().getId())
                        .username(f.getFollowingUser().getUsername())
                        .profilePicture(f.getFollowingUser().getProfilePicture())
                        .build())
                .toList();
    }

    private boolean isValidPassword(String password) {
        // At least 8 chars, 1 uppercase, 1 number
        return password != null &&
                password.length() >= 8 &&
                password.matches(".*[A-Z].*") &&
                password.matches(".*\\d.*");
    }

    private int countCommaValues(String str) {
        if (str == null || str.isEmpty())
            return 0;
        return str.split(",").length;
    }
}
