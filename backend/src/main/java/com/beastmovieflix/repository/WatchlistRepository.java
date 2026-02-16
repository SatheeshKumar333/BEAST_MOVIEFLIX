package com.beastmovieflix.repository;

import com.beastmovieflix.entity.Watchlist;
import com.beastmovieflix.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Watchlist Repository
 * 
 * @author Satheesh Kumar
 */
@Repository
public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {

    List<Watchlist> findByUserOrderByAddedAtDesc(User user);

    List<Watchlist> findByUserIdOrderByAddedAtDesc(Long userId);

    boolean existsByUserIdAndMovieId(Long userId, Long movieId);

    void deleteByUserIdAndMovieId(Long userId, Long movieId);
}
