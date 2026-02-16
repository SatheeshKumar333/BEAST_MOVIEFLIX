package com.beastmovieflix.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * MovieLog Entity - Represents a movie diary entry
 * 
 * @author Satheesh Kumar
 */
@Entity
@Table(name = "movie_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user who logged this
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // The movie tracked
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    // When the user watched it (full date + time)
    @Column(name = "watch_date", columnDefinition = "DATETIME")
    private LocalDateTime watchDate;

    // Rating 1-10
    @Min(1)
    @Max(10)
    private Integer rating;

    // Status: WATCHED, PLANNED, DROPPED
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.WATCHED;

    // Language the user watched in
    @Column(name = "language_watched", length = 100)
    private String languageWatched;

    // When this log was created
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.watchDate == null) {
            this.watchDate = LocalDateTime.now();
        }
    }

    public enum Status {
        WATCHED, PLANNED, DROPPED
    }
}
