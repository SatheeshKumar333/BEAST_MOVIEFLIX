package com.beastmovieflix.repository;

import com.beastmovieflix.entity.GroupMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * GroupMessage Repository - Database operations for GroupMessage entity
 * 
 * @author Satheesh Kumar
 */
@Repository
public interface GroupMessageRepository extends JpaRepository<GroupMessage, Long> {

    List<GroupMessage> findByGroupIdOrderBySentAtAsc(Long groupId);

    List<GroupMessage> findByGroupIdOrderBySentAtDesc(Long groupId);

    List<GroupMessage> findTop50ByGroupIdOrderBySentAtDesc(Long groupId);
}
