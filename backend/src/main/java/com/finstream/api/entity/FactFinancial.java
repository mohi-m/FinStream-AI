package com.finstream.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "fact_financials")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactFinancial {
    @EmbeddedId
    private FactFinancialId id;

    @Column(name = "total_revenue", precision = 20, scale = 2)
    private java.math.BigDecimal totalRevenue;

    @Column(name = "net_income", precision = 20, scale = 2)
    private java.math.BigDecimal netIncome;

    @Column(name = "ebitda", precision = 20, scale = 2)
    private java.math.BigDecimal ebitda;

    @Column(name = "total_assets", precision = 20, scale = 2)
    private java.math.BigDecimal totalAssets;

    @Column(name = "total_liabilities", precision = 20, scale = 2)
    private java.math.BigDecimal totalLiabilities;

    @Column(name = "total_equity", precision = 20, scale = 2)
    private java.math.BigDecimal totalEquity;

    @Column(name = "cash_and_equivalents", precision = 20, scale = 2)
    private java.math.BigDecimal cashAndEquivalents;

    @Column(name = "operating_cash_flow", precision = 20, scale = 2)
    private java.math.BigDecimal operatingCashFlow;

    @Column(name = "free_cash_flow", precision = 20, scale = 2)
    private java.math.BigDecimal freeCashFlow;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticker_id", insertable = false, updatable = false)
    private DimTicker ticker;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FactFinancialId implements Serializable {
        @Column(name = "ticker_id", length = 10)
        private String tickerId;

        @Column(name = "report_date")
        private LocalDate reportDate;

        @Column(name = "report_type", length = 20)
        private String reportType;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            FactFinancialId that = (FactFinancialId) o;
            return Objects.equals(tickerId, that.tickerId) &&
                    Objects.equals(reportDate, that.reportDate) &&
                    Objects.equals(reportType, that.reportType);
        }

        @Override
        public int hashCode() {
            return Objects.hash(tickerId, reportDate, reportType);
        }
    }
}
