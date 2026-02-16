package com.beastmovieflix.dto;

import lombok.*;
import java.time.LocalDateTime;

/**
 * DTOs for Watchlist and Favorites operations
 * 
 * @author Satheesh Kumar
 */
public class MediaListDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddToListRequest {
        private Long tmdbId;
        private String mediaType; // "movie" or "tv"
        private String title;
        private String posterPath;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MediaListItem {
        private Long id;
        private Long tmdbId;
        private String mediaType;
        private String title;
        private String posterPath;
        private LocalDateTime addedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CheckResponse {
        private boolean inWatchlist;
        private boolean inFavorites;
    }
}
