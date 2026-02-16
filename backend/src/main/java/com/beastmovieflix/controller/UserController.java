package com.beastmovieflix.controller;

import com.beastmovieflix.dto.AuthDTO.*;
import com.beastmovieflix.entity.User;
import com.beastmovieflix.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * User Controller - Handle user profile operations
 * 
 * @author Satheesh Kumar
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDTO> getProfile(@AuthenticationPrincipal User user) {
        UserProfileDTO profile = userService.getProfile(user.getId());
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<UserProfileDTO> getProfileById(@PathVariable Long userId) {
        UserProfileDTO profile = userService.getProfile(userId);
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/search")
    public ResponseEntity<java.util.List<UserProfileDTO>> searchUsers(@RequestParam String query) {
        java.util.List<UserProfileDTO> users = userService.searchUsers(query);
        return ResponseEntity.ok(users);
    }

    @PostMapping("/follow/{userId}")
    public ResponseEntity<?> followUser(@AuthenticationPrincipal User user, @PathVariable Long userId) {
        userService.followUser(user.getId(), userId);
        return ResponseEntity.ok(AuthResponse.builder().message("User followed successfully").build());
    }

    @PostMapping("/unfollow/{userId}")
    public ResponseEntity<?> unfollowUser(@AuthenticationPrincipal User user, @PathVariable Long userId) {
        userService.unfollowUser(user.getId(), userId);
        return ResponseEntity.ok(AuthResponse.builder().message("User unfollowed successfully").build());
    }

    @GetMapping("/followers/{userId}")
    public ResponseEntity<java.util.List<UserProfileDTO>> getFollowers(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getFollowers(userId));
    }

    @GetMapping("/following/{userId}")
    public ResponseEntity<java.util.List<UserProfileDTO>> getFollowing(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getFollowing(userId));
    }

    @PutMapping(value = "/profile", consumes = "application/json")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest request) {
        System.out.println("Update profile request received for user: " + (user != null ? user.getUsername() : "null"));
        if (user == null) {
            return ResponseEntity.status(403)
                    .body(AuthResponse.builder().message("User not authenticated in controller").build());
        }
        try {
            UserProfileDTO updatedProfile = userService.updateProfile(user.getId(), request);
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            System.err.println("Error updating profile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(AuthResponse.builder().message(e.getMessage()).build());
        }
    }
}
