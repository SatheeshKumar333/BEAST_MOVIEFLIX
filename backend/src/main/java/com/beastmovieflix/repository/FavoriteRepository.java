package com.beastmovieflix.repository;

import com.beastmovieflix.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Favorite Repository
 * 
 * @author Satheesh Kumar
 */
@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByUserIdOrderByAddedAtDesc(Long userId);

    Optional<Favorite> findByUserIdAndTmdbIdAndMediaType(Long userId, Long tmdbId, Favorite.MediaType mediaType);

    boolean existsByUserIdAndTmdbIdAndMediaType(Long userId, Long tmdbId, Favorite.MediaType mediaType);

    void deleteByUserIdAndTmdbIdAndMediaType(Long userId, Long tmdbId, Favorite.MediaType mediaType);
}
