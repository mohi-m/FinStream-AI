package com.finstream.api.repository;

import com.finstream.api.entity.FactPriceDaily;
import com.finstream.api.entity.FactPriceDaily.FactPriceDailyId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface FactPriceDailyRepository extends JpaRepository<FactPriceDaily, FactPriceDailyId> {
    @Query("SELECT p FROM FactPriceDaily p WHERE p.id.tickerId = :tickerId " +
           "AND p.id.date >= :fromDate AND p.id.date <= :toDate " +
           "ORDER BY p.id.date ASC")
    Page<FactPriceDaily> findByTickerAndDateRange(
            @Param("tickerId") String tickerId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    @Query("SELECT p FROM FactPriceDaily p WHERE p.id.tickerId = :tickerId " +
           "ORDER BY p.id.date DESC LIMIT 1")
    Optional<FactPriceDaily> findLatestByTicker(@Param("tickerId") String tickerId);
}
