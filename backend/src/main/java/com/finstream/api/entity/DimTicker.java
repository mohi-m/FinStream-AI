package com.finstream.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "dim_ticker")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DimTicker {
    @Id
    @Column(name = "ticker_id", length = 10)
    private String tickerId;

    @Column(name = "company_name", length = 255)
    private String companyName;

    @Column(name = "sector", length = 100)
    private String sector;

    @Column(name = "industry", length = 100)
    private String industry;

    @Column(name = "currency", length = 10)
    private String currency;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}
