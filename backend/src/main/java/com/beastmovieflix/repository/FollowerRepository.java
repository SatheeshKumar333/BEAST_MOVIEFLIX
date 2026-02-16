package com.beastmovieflix.repository;

import com.beastmovieflix.entity.Follower;
import com.beastmovieflix.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowerRepository extends JpaRepository<Follower, Long> {
    List<Follower> findByFollowerUser(User followerUser);

    List<Follower> findByFollowingUser(User followingUser);

    Optional<Follower> findByFollowerUserAndFollowingUser(User followerUser, User followingUser);

    boolean existsByFollowerUserAndFollowingUser(User followerUser, User followingUser);

    long countByFollowingUser(User followingUser);

    long countByFollowerUser(User followerUser);
}
