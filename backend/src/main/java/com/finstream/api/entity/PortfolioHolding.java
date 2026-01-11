package com.finstream.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "portfolio_holding")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioHolding {
    @EmbeddedId
    private PortfolioHoldingId id;

    @Column(name = "quantity", nullable = false, precision = 20, scale = 6)
    private BigDecimal quantity;

    @Column(name = "cash_balance", precision = 20, scale = 6)
    private BigDecimal cashBalance;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", insertable = false, updatable = false)
    private UserPortfolio portfolio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticker_id", insertable = false, updatable = false)
    private DimTicker ticker;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (cashBalance == null) {
            cashBalance = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PortfolioHoldingId implements Serializable {
        @Column(name = "portfolio_id")
        private UUID portfolioId;

        @Column(name = "ticker_id", length = 10)
        private String tickerId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            PortfolioHoldingId that = (PortfolioHoldingId) o;
            return Objects.equals(portfolioId, that.portfolioId) &&
                    Objects.equals(tickerId, that.tickerId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(portfolioId, tickerId);
        }
    }
}
