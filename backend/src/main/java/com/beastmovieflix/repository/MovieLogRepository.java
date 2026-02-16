package com.beastmovieflix.repository;

import com.beastmovieflix.entity.MovieLog;
import com.beastmovieflix.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * MovieLog Repository - Database operations for MovieLog entity
 * 
 * @author Satheesh Kumar
 */
@Repository
public interface MovieLogRepository extends JpaRepository<MovieLog, Long> {

    List<MovieLog> findByUserOrderByWatchDateDesc(User user);

    List<MovieLog> findByUserIdOrderByWatchDateDesc(Long userId);

    @Query("SELECT ml FROM MovieLog ml WHERE ml.user.id = :userId ORDER BY ml.createdAt DESC")
    List<MovieLog> findRecentLogsByUserId(Long userId);

    boolean existsByUserIdAndMovieId(Long userId, Long movieId);

    List<MovieLog> findByUserIdAndStatus(Long userId, MovieLog.Status status);
}
