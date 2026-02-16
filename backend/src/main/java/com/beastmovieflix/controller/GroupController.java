package com.beastmovieflix.controller;

import com.beastmovieflix.dto.GroupDTO.CreateGroupRequest;
import com.beastmovieflix.dto.GroupDTO.GroupDetailResponse;
import com.beastmovieflix.dto.GroupDTO.GroupResponse;
import com.beastmovieflix.dto.GroupDTO.MessageDTO;
import com.beastmovieflix.dto.GroupDTO.SendMessageRequest;
import com.beastmovieflix.entity.User;
import com.beastmovieflix.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Group Controller - Handle group and messaging operations
 * 
 * @author Satheesh Kumar
 */
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateGroupRequest request) {
        GroupResponse response = groupService.createGroup(user.getId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getUserGroups(@AuthenticationPrincipal User user) {
        List<GroupResponse> groups = groupService.getUserGroups(user.getId());
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupDetailResponse> getGroupDetails(@PathVariable Long groupId) {
        GroupDetailResponse details = groupService.getGroupDetails(groupId);
        return ResponseEntity.ok(details);
    }

    @PostMapping("/{groupId}/messages")
    public ResponseEntity<MessageDTO> sendMessage(
            @PathVariable Long groupId,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody SendMessageRequest request) {
        MessageDTO message = groupService.sendMessage(groupId, user.getId(), request);
        return ResponseEntity.ok(message);
    }

    @PostMapping("/{groupId}/join")
    public ResponseEntity<Void> joinGroup(
            @PathVariable Long groupId,
            @AuthenticationPrincipal User user) {
        groupService.joinGroup(groupId, user.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<Void> leaveGroup(
            @PathVariable Long groupId,
            @AuthenticationPrincipal User user) {
        groupService.leaveGroup(groupId, user.getId());
        return ResponseEntity.ok().build();
    }
}
