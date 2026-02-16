package com.beastmovieflix.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Report Entity - For user-reported content
 * 
 * @author Satheesh Kumar
 */
@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportType type;

    @Column(nullable = false)
    private Long targetId; // ID of reported user/log/review/group

    @Column(nullable = false)
    private Long reporterId; // User who reported

    @Column(length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING;

    private String actionTaken;

    private Long actionBy; // Admin who handled

    private LocalDateTime actionAt;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum ReportType {
        USER, LOG, REVIEW, GROUP
    }

    public enum ReportStatus {
        PENDING, RESOLVED, DISMISSED
    }
}
