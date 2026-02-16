package com.beastmovieflix.repository;

import com.beastmovieflix.entity.MovieGroup;
import com.beastmovieflix.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * MovieGroup Repository - Database operations for MovieGroup entity
 * 
 * @author Satheesh Kumar
 */
@Repository
public interface MovieGroupRepository extends JpaRepository<MovieGroup, Long> {

    List<MovieGroup> findByCreator(User creator);

    List<MovieGroup> findByCreatorId(Long creatorId);

    @Query("SELECT g FROM MovieGroup g JOIN g.members m WHERE m.user.id = :userId")
    List<MovieGroup> findGroupsByMemberId(Long userId);

    @Query("SELECT DISTINCT g FROM MovieGroup g LEFT JOIN g.members m WHERE g.creator.id = :userId OR m.user.id = :userId")
    List<MovieGroup> findAllUserGroups(Long userId);
}
