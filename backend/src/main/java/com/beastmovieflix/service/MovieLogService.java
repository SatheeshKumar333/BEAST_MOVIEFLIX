package com.beastmovieflix.service;

import com.beastmovieflix.dto.MovieLogDTO.CreateLogRequest;
import com.beastmovieflix.dto.MovieLogDTO.LogResponse;
import com.beastmovieflix.dto.MovieLogDTO.UpdateLogRequest;
import com.beastmovieflix.entity.Movie;
import com.beastmovieflix.entity.MovieLog;
import com.beastmovieflix.entity.Review;
import com.beastmovieflix.entity.User;
import com.beastmovieflix.repository.MovieLogRepository;
import com.beastmovieflix.repository.MovieRepository;
import com.beastmovieflix.repository.ReviewRepository;
import com.beastmovieflix.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * MovieLog Service - Business logic for movie diary operations
 * 
 * @author Satheesh Kumar
 */
@Service
@RequiredArgsConstructor
public class MovieLogService {

    private final MovieLogRepository movieLogRepository;
    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final ReviewRepository reviewRepository;

    @Transactional
    public LogResponse createLog(Long userId, CreateLogRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        // Check if movie exists, if not create it
        Movie movie = movieRepository.findByTmdbId(request.getTmdbId())
                .orElseGet(() -> {
                    Movie newMovie = Movie.builder()
                            .tmdbId(request.getTmdbId())
                            .title(request.getTitle())
                            .posterUrl(request.getPosterPath())
                            .build();
                    return movieRepository.save(newMovie);
                });

        MovieLog log = MovieLog.builder()
                .user(user)
                .movie(movie)
                .status(MovieLog.Status.WATCHED)
                .rating(request.getRating())
                .languageWatched(request.getLanguageWatched())
                .watchDate(request.getWatchedAt() != null ? request.getWatchedAt()
                        : LocalDateTime.now())
                .build();

        MovieLog savedLog = movieLogRepository.save(log);

        // If review is provided, create a review
        if (request.getReview() != null && !request.getReview().isEmpty()) {
            Review review = Review.builder()
                    .user(user)
                    .movie(movie)
                    .reviewText(request.getReview())
                    .build();
            reviewRepository.save(review);
        }

        return mapToResponse(savedLog);
    }

    @Transactional(readOnly = true)
    public List<LogResponse> getUserLogs(Long userId) {
        List<MovieLog> logs = movieLogRepository.findByUserIdOrderByWatchDateDesc(userId);
        return logs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LogResponse getLog(Long logId) {
        MovieLog log = movieLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Log not found!"));
        return mapToResponse(log);
    }

    @Transactional
    public LogResponse updateLog(Long logId, Long userId, UpdateLogRequest request) {
        MovieLog log = movieLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Log not found!"));

        if (!log.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to update this log!");
        }

        if (request.getRating() != null)
            log.setRating(request.getRating());
        if (request.getWatchedAt() != null)
            log.setWatchDate(request.getWatchedAt());

        MovieLog updatedLog = movieLogRepository.save(log);
        return mapToResponse(updatedLog);
    }

    @Transactional
    public void deleteLog(Long logId, Long userId) {
        MovieLog log = movieLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Log not found!"));

        if (!log.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this log!");
        }

        movieLogRepository.delete(log);
    }

    private LogResponse mapToResponse(MovieLog log) {
        // Fetch review for this user+movie combination
        String reviewText = null;
        try {
            reviewText = reviewRepository
                    .findByUserIdAndMovieId(log.getUser().getId(), log.getMovie().getId())
                    .map(Review::getReviewText)
                    .orElse(null);
        } catch (Exception e) {
            // Ignore if review lookup fails
        }

        return LogResponse.builder()
                .id(log.getId())
                .tmdbId(log.getMovie().getTmdbId())
                .title(log.getMovie().getTitle())
                .posterPath(log.getMovie().getPosterUrl())
                .review(reviewText)
                .rating(log.getRating())
                .mediaType("movie")
                .languageWatched(log.getLanguageWatched())
                .watchedAt(log.getWatchDate())
                .createdAt(log.getCreatedAt())
                .userId(log.getUser().getId())
                .username(log.getUser().getUsername())
                .build();
    }
}
