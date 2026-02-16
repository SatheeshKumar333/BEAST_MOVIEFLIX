package com.beastmovieflix.repository;

import com.beastmovieflix.entity.UserFollower;
import com.beastmovieflix.entity.UserFollowerId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * UserFollower Repository
 * 
 * @author Satheesh Kumar
 */
@Repository
public interface UserFollowerRepository extends JpaRepository<UserFollower, UserFollowerId> {

    // Get all followers of a user
    @Query("SELECT uf FROM UserFollower uf WHERE uf.following.id = ?1")
    List<UserFollower> findFollowers(Long userId);

    // Get all users that a user is following
    @Query("SELECT uf FROM UserFollower uf WHERE uf.follower.id = ?1")
    List<UserFollower> findFollowing(Long userId);

    // Check if user1 follows user2
    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    // Delete follow relationship
    void deleteByFollowerIdAndFollowingId(Long followerId, Long followingId);
}
