package com.beastmovieflix.repository;

import com.beastmovieflix.entity.GroupMember;
import com.beastmovieflix.entity.MovieGroup;
import com.beastmovieflix.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByGroup(MovieGroup group);

    List<GroupMember> findByUser(User user);

    Optional<GroupMember> findByGroupAndUser(MovieGroup group, User user);

    boolean existsByGroupAndUser(MovieGroup group, User user);
}
