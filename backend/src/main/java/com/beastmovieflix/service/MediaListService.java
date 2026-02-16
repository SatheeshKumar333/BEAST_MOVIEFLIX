package com.beastmovieflix.service;

import com.beastmovieflix.dto.MediaListDTO.*;
import com.beastmovieflix.entity.Favorite;
import com.beastmovieflix.entity.User;
import com.beastmovieflix.entity.Watchlist;
import com.beastmovieflix.entity.Movie;
import com.beastmovieflix.repository.FavoriteRepository;
import com.beastmovieflix.repository.WatchlistRepository;
import com.beastmovieflix.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for Watchlist and Favorites operations
 *
 * @author Satheesh Kumar
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MediaListService {

    private final FavoriteRepository favoriteRepository;
    private final WatchlistRepository watchlistRepository;
    private final MovieRepository movieRepository;

    // ==================== FAVORITES ====================

    @Transactional
    public MediaListItem addToFavorites(User user, AddToListRequest request) {
        // Check if already exists
        Favorite.MediaType mediaType = Favorite.MediaType.valueOf(request.getMediaType());
        if (favoriteRepository.existsByUserIdAndTmdbIdAndMediaType(
                user.getId(), request.getTmdbId(), mediaType)) {
            throw new RuntimeException("Already in favorites");
        }

        Favorite favorite = Favorite.builder()
                .user(user)
                .tmdbId(request.getTmdbId())
                .mediaType(mediaType)
                .title(request.getTitle())
                .posterPath(request.getPosterPath())
                .build();

        favorite = favoriteRepository.save(favorite);
        log.info("Added to favorites: {} for user {}", request.getTitle(), user.getUsername());
        return mapFavoriteToItem(favorite);
    }

    @Transactional
    public void removeFromFavorites(User user, Long tmdbId, String mediaType) {
        Favorite.MediaType type = Favorite.MediaType.valueOf(mediaType);
        favoriteRepository.deleteByUserIdAndTmdbIdAndMediaType(user.getId(), tmdbId, type);
        log.info("Removed from favorites: tmdbId={} for user {}", tmdbId, user.getUsername());
    }

    public List<MediaListItem> getUserFavorites(Long userId) {
        return favoriteRepository.findByUserIdOrderByAddedAtDesc(userId)
                .stream()
                .map(this::mapFavoriteToItem)
                .collect(Collectors.toList());
    }

    public boolean isInFavorites(Long userId, Long tmdbId, String mediaType) {
        return favoriteRepository.existsByUserIdAndTmdbIdAndMediaType(
                userId, tmdbId, Favorite.MediaType.valueOf(mediaType));
    }

    // ==================== WATCHLIST ====================

    @Transactional
    public MediaListItem addToWatchlist(User user, AddToListRequest request) {
        // Find or create the Movie entity
        Movie movie = movieRepository.findByTmdbId(request.getTmdbId())
                .orElseGet(() -> {
                    Movie newMovie = new Movie();
                    newMovie.setTmdbId(request.getTmdbId());
                    newMovie.setTitle(request.getTitle());
                    newMovie.setPosterUrl(request.getPosterPath());
                    return movieRepository.save(newMovie);
                });

        // Check if already in watchlist
        if (watchlistRepository.existsByUserIdAndMovieId(user.getId(), movie.getId())) {
            throw new RuntimeException("Already in watchlist");
        }

        Watchlist watchlist = Watchlist.builder()
                .user(user)
                .movie(movie)
                .build();

        watchlist = watchlistRepository.save(watchlist);
        log.info("Added to watchlist: {} for user {}", request.getTitle(), user.getUsername());
        return mapWatchlistToItem(watchlist);
    }

    @Transactional
    public void removeFromWatchlist(User user, Long tmdbId) {
        Movie movie = movieRepository.findByTmdbId(tmdbId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        watchlistRepository.deleteByUserIdAndMovieId(user.getId(), movie.getId());
        log.info("Removed from watchlist: tmdbId={} for user {}", tmdbId, user.getUsername());
    }

    public List<MediaListItem> getUserWatchlist(Long userId) {
        return watchlistRepository.findByUserIdOrderByAddedAtDesc(userId)
                .stream()
                .map(this::mapWatchlistToItem)
                .collect(Collectors.toList());
    }

    public boolean isInWatchlist(Long userId, Long tmdbId) {
        return movieRepository.findByTmdbId(tmdbId)
                .map(movie -> watchlistRepository.existsByUserIdAndMovieId(userId, movie.getId()))
                .orElse(false);
    }

    // ==================== CHECK STATUS ====================

    public CheckResponse checkStatus(Long userId, Long tmdbId, String mediaType) {
        boolean inFavorites = isInFavorites(userId, tmdbId, mediaType);
        boolean inWatchlist = isInWatchlist(userId, tmdbId);
        return CheckResponse.builder()
                .inFavorites(inFavorites)
                .inWatchlist(inWatchlist)
                .build();
    }

    // ==================== MAPPERS ====================

    private MediaListItem mapFavoriteToItem(Favorite fav) {
        return MediaListItem.builder()
                .id(fav.getId())
                .tmdbId(fav.getTmdbId())
                .mediaType(fav.getMediaType().name())
                .title(fav.getTitle())
                .posterPath(fav.getPosterPath())
                .addedAt(fav.getAddedAt())
                .build();
    }

    private MediaListItem mapWatchlistToItem(Watchlist wl) {
        Movie movie = wl.getMovie();
        return MediaListItem.builder()
                .id(wl.getId())
                .tmdbId(movie != null ? movie.getTmdbId() : null)
                .mediaType("movie")
                .title(movie != null ? movie.getTitle() : "Unknown")
                .posterPath(movie != null ? movie.getPosterUrl() : null)
                .addedAt(wl.getAddedAt())
                .build();
    }
}
