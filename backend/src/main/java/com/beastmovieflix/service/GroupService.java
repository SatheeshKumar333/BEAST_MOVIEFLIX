package com.beastmovieflix.service;

import com.beastmovieflix.dto.GroupDTO.CreateGroupRequest;
import com.beastmovieflix.dto.GroupDTO.GroupDetailResponse;
import com.beastmovieflix.dto.GroupDTO.GroupResponse;
import com.beastmovieflix.dto.GroupDTO.MemberDTO;
import com.beastmovieflix.dto.GroupDTO.MessageDTO;
import com.beastmovieflix.dto.GroupDTO.SendMessageRequest;
import com.beastmovieflix.entity.*;
import com.beastmovieflix.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Group Service - Business logic for group operations
 * 
 * @author Satheesh Kumar
 */
@Service
@RequiredArgsConstructor
public class GroupService {

        private final MovieGroupRepository groupRepository;
        private final GroupMessageRepository messageRepository;
        private final UserRepository userRepository;
        private final GroupMemberRepository groupMemberRepository;

        @Transactional
        public GroupResponse createGroup(Long userId, CreateGroupRequest request) {
                User creator = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found!"));

                MovieGroup group = MovieGroup.builder()
                                .name(request.getName())
                                .description(request.getDescription())
                                .creator(creator)
                                .build();

                // Save group first to get ID
                MovieGroup savedGroup = groupRepository.save(group);

                // Add creator as ADMIN member
                GroupMember member = GroupMember.builder()
                                .group(savedGroup)
                                .user(creator)
                                .role(GroupMember.Role.ADMIN)
                                .build();

                groupMemberRepository.save(member);

                // Add other members if provided
                if (request.getMemberIds() != null && !request.getMemberIds().isEmpty()) {
                        for (Long memberId : request.getMemberIds()) {
                                if (memberId.equals(userId))
                                        continue; // Skip creator (already added)

                                userRepository.findById(memberId).ifPresent(user -> {
                                        GroupMember newMember = GroupMember.builder()
                                                        .group(savedGroup)
                                                        .user(user)
                                                        .role(GroupMember.Role.MEMBER)
                                                        .build();
                                        groupMemberRepository.save(newMember);
                                });
                        }
                }

                return mapToResponse(savedGroup);
        }

        @Transactional(readOnly = true)
        public List<GroupResponse> getUserGroups(Long userId) {
                List<MovieGroup> groups = groupRepository.findAllUserGroups(userId);
                return groups.stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public GroupDetailResponse getGroupDetails(Long groupId) {
                MovieGroup group = groupRepository.findById(groupId)
                                .orElseThrow(() -> new RuntimeException("Group not found!"));

                List<GroupMessage> recentMessages = messageRepository.findTop50ByGroupIdOrderBySentAtDesc(groupId);

                return GroupDetailResponse.builder()
                                .id(group.getId())
                                .name(group.getName())
                                .description(group.getDescription())
                                .creatorId(group.getCreator().getId())
                                .creatorName(group.getCreator().getUsername())
                                .members(group.getMembers().stream()
                                                .map(m -> MemberDTO.builder()
                                                                .id(m.getUser().getId())
                                                                .username(m.getUser().getUsername())
                                                                .profilePicture(m.getUser().getProfilePicture())
                                                                .build())
                                                .collect(Collectors.toList()))
                                .recentMessages(recentMessages.stream()
                                                .map(msg -> MessageDTO.builder()
                                                                .id(msg.getId())
                                                                .content(msg.getMessage())
                                                                .senderId(msg.getUser().getId())
                                                                .senderName(msg.getUser().getUsername())
                                                                .createdAt(msg.getSentAt())
                                                                .build())
                                                .collect(Collectors.toList()))
                                .createdAt(group.getCreatedAt())
                                .build();
        }

        @Transactional
        public MessageDTO sendMessage(Long groupId, Long senderId, SendMessageRequest request) {
                MovieGroup group = groupRepository.findById(groupId)
                                .orElseThrow(() -> new RuntimeException("Group not found!"));

                User sender = userRepository.findById(senderId)
                                .orElseThrow(() -> new RuntimeException("User not found!"));

                // Check if user is a member
                boolean isMember = groupMemberRepository.existsByGroupAndUser(group, sender);

                if (!isMember) {
                        throw new RuntimeException("You are not a member of this group!");
                }

                GroupMessage message = GroupMessage.builder()
                                .message(request.getContent())
                                .group(group)
                                .user(sender)
                                .build();

                GroupMessage savedMessage = messageRepository.save(message);

                return MessageDTO.builder()
                                .id(savedMessage.getId())
                                .content(savedMessage.getMessage())
                                .senderId(sender.getId())
                                .senderName(sender.getUsername())
                                .createdAt(savedMessage.getSentAt())
                                .build();
        }

        @Transactional
        public void joinGroup(Long groupId, Long userId) {
                MovieGroup group = groupRepository.findById(groupId)
                                .orElseThrow(() -> new RuntimeException("Group not found!"));

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found!"));

                if (groupMemberRepository.existsByGroupAndUser(group, user)) {
                        throw new RuntimeException("Already a member of this group!");
                }

                GroupMember member = GroupMember.builder()
                                .group(group)
                                .user(user)
                                .role(GroupMember.Role.MEMBER)
                                .build();

                groupMemberRepository.save(member);
        }

        @Transactional
        public void leaveGroup(Long groupId, Long userId) {
                MovieGroup group = groupRepository.findById(groupId)
                                .orElseThrow(() -> new RuntimeException("Group not found!"));

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found!"));

                GroupMember member = groupMemberRepository.findByGroupAndUser(group, user)
                                .orElseThrow(() -> new RuntimeException("Not a member of this group!"));

                if (group.getCreator().getId().equals(userId)) {
                        throw new RuntimeException("Creator cannot leave the group!");
                }

                groupMemberRepository.delete(member);
        }

        private GroupResponse mapToResponse(MovieGroup group) {
                return GroupResponse.builder()
                                .id(group.getId())
                                .name(group.getName())
                                .description(group.getDescription())
                                .creatorId(group.getCreator().getId())
                                .creatorName(group.getCreator().getUsername())
                                .memberCount(group.getMembers().size())
                                .messageCount(group.getMessages().size()) // This might be slow if list is large, but
                                                                          // acceptable for now
                                .createdAt(group.getCreatedAt())
                                .build();
        }
}
