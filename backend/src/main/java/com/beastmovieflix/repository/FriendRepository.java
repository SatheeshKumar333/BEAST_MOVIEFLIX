package com.beastmovieflix.repository;

import com.beastmovieflix.entity.Friend;
import com.beastmovieflix.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {
    List<Friend> findByUser(User user);

    List<Friend> findByFriendUser(User friendUser);

    Optional<Friend> findByUserAndFriendUser(User user, User friendUser);

    boolean existsByUserAndFriendUser(User user, User friendUser);
}
