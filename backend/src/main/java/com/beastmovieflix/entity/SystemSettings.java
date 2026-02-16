package com.beastmovieflix.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * SystemSettings Entity - App configuration and feature toggles
 * 
 * @author Satheesh Kumar
 */
@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String settingKey;

    @Column(columnDefinition = "TEXT")
    private String settingValue;

    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SettingType type = SettingType.STRING;

    private LocalDateTime updatedAt;

    private Long updatedBy;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum SettingType {
        STRING, BOOLEAN, NUMBER
    }
}
