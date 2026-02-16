package com.beastmovieflix.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs for Group operations
 * 
 * @author Satheesh Kumar
 */
public class GroupDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateGroupRequest {
        @NotBlank(message = "Group name is required")
        @Size(min = 2, max = 100)
        private String name;

        private String description;

        private List<Long> memberIds;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GroupResponse {
        private Long id;
        private String name;
        private String description;
        private Long creatorId;
        private String creatorName;
        private int memberCount;
        private int messageCount;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GroupDetailResponse {
        private Long id;
        private String name;
        private String description;
        private Long creatorId;
        private String creatorName;
        private List<MemberDTO> members;
        private List<MessageDTO> recentMessages;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberDTO {
        private Long id;
        private String username;
        private String profilePicture;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageDTO {
        private Long id;
        private String content;
        private Long senderId;
        private String senderName;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SendMessageRequest {
        @NotBlank(message = "Message content is required")
        @Size(max = 1000)
        private String content;
    }
}
