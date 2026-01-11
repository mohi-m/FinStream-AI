package com.finstream.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "fact_price_daily")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactPriceDaily {
    @EmbeddedId
    private FactPriceDailyId id;

    @Column(name = "open", precision = 15, scale = 4)
    private BigDecimal open;

    @Column(name = "high", precision = 15, scale = 4)
    private BigDecimal high;

    @Column(name = "low", precision = 15, scale = 4)
    private BigDecimal low;

    @Column(name = "close", precision = 15, scale = 4)
    private BigDecimal close;

    @Column(name = "volume")
    private Long volume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticker_id", insertable = false, updatable = false)
    private DimTicker ticker;

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FactPriceDailyId implements Serializable {
        @Column(name = "ticker_id", length = 10)
        private String tickerId;

        @Column(name = "date")
        private LocalDate date;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            FactPriceDailyId that = (FactPriceDailyId) o;
            return Objects.equals(tickerId, that.tickerId) &&
                    Objects.equals(date, that.date);
        }

        @Override
        public int hashCode() {
            return Objects.hash(tickerId, date);
        }
    }
}
