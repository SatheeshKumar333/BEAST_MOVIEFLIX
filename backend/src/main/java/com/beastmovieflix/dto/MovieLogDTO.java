package com.beastmovieflix.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * DTOs for MovieLog operations
 * 
 * @author Satheesh Kumar
 */
public class MovieLogDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateLogRequest {
        @NotNull(message = "TMDB ID is required")
        private Long tmdbId;

        @NotBlank(message = "Media type is required")
        private String mediaType;

        @NotBlank(message = "Title is required")
        private String title;

        private String posterPath;

        @Size(max = 1000)
        private String review;

        @Min(1)
        @Max(10)
        private Integer rating;

        private String languageWatched;

        private LocalDateTime watchedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LogResponse {
        private Long id;
        private Long tmdbId;
        private String mediaType;
        private String title;
        private String posterPath;
        private String review;
        private Integer rating;
        private String languageWatched;
        private LocalDateTime watchedAt;
        private LocalDateTime createdAt;
        private Long userId;
        private String username;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateLogRequest {
        @Size(max = 1000)
        private String review;

        @Min(1)
        @Max(10)
        private Integer rating;

        private String languageWatched;

        private LocalDateTime watchedAt;
    }
}
