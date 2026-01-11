package com.finstream.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_user")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppUser {
    @Id
    @Column(name = "firebase_uid", length = 128)
    private String firebaseUid;

    @Column(name = "email", length = 320, unique = true)
    private String email;

    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
