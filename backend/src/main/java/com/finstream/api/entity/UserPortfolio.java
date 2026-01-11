package com.finstream.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_portfolio")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPortfolio {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "portfolio_id")
    private UUID portfolioId;

    @Column(name = "firebase_uid", nullable = false, length = 128)
    private String firebaseUid;

    @Column(name = "portfolio_name", nullable = false, length = 255)
    private String portfolioName;

    @Column(name = "base_currency", nullable = false, length = 10)
    private String baseCurrency;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "firebase_uid", insertable = false, updatable = false)
    private AppUser appUser;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (baseCurrency == null) {
            baseCurrency = "USD";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
