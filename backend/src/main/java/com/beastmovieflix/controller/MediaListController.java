package com.beastmovieflix.controller;

import com.beastmovieflix.dto.MediaListDTO.*;
import com.beastmovieflix.entity.User;
import com.beastmovieflix.service.MediaListService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Media List Controller - Watchlist & Favorites API
 *
 * @author Satheesh Kumar
 */
@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaListController {

    private final MediaListService mediaListService;

    // ==================== FAVORITES ====================

    @PostMapping("/favorites")
    public ResponseEntity<?> addToFavorites(
            @AuthenticationPrincipal User user,
            @RequestBody AddToListRequest request) {
        try {
            MediaListItem item = mediaListService.addToFavorites(user, request);
            return ResponseEntity.ok(item);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/favorites/{tmdbId}")
    public ResponseEntity<?> removeFromFavorites(
            @AuthenticationPrincipal User user,
            @PathVariable Long tmdbId,
            @RequestParam String mediaType) {
        try {
            mediaListService.removeFromFavorites(user, tmdbId, mediaType);
            return ResponseEntity.ok(Map.of("message", "Removed from favorites"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/favorites")
    public ResponseEntity<List<MediaListItem>> getUserFavorites(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mediaListService.getUserFavorites(user.getId()));
    }

    // ==================== WATCHLIST ====================

    @PostMapping("/watchlist")
    public ResponseEntity<?> addToWatchlist(
            @AuthenticationPrincipal User user,
            @RequestBody AddToListRequest request) {
        try {
            MediaListItem item = mediaListService.addToWatchlist(user, request);
            return ResponseEntity.ok(item);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/watchlist/{tmdbId}")
    public ResponseEntity<?> removeFromWatchlist(
            @AuthenticationPrincipal User user,
            @PathVariable Long tmdbId) {
        try {
            mediaListService.removeFromWatchlist(user, tmdbId);
            return ResponseEntity.ok(Map.of("message", "Removed from watchlist"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/watchlist")
    public ResponseEntity<List<MediaListItem>> getUserWatchlist(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(mediaListService.getUserWatchlist(user.getId()));
    }

    // ==================== CHECK STATUS ====================

    @GetMapping("/check/{tmdbId}")
    public ResponseEntity<CheckResponse> checkStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long tmdbId,
            @RequestParam(defaultValue = "movie") String mediaType) {
        return ResponseEntity.ok(
                mediaListService.checkStatus(user.getId(), tmdbId, mediaType));
    }
}
