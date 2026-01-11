package com.finstream.api.repository;

import com.finstream.api.entity.FactFinancial;
import com.finstream.api.entity.FactFinancial.FactFinancialId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface FactFinancialRepository extends JpaRepository<FactFinancial, FactFinancialId> {
    @Query("SELECT f FROM FactFinancial f WHERE f.id.tickerId = :tickerId " +
           "AND f.id.reportType = :reportType " +
           "AND f.id.reportDate >= :fromDate AND f.id.reportDate <= :toDate " +
           "ORDER BY f.id.reportDate ASC")
    Page<FactFinancial> findByTickerAndTypeAndDateRange(
            @Param("tickerId") String tickerId,
            @Param("reportType") String reportType,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    @Query("SELECT f FROM FactFinancial f WHERE f.id.tickerId = :tickerId " +
           "AND f.id.reportType = :reportType " +
           "ORDER BY f.id.reportDate DESC LIMIT 1")
    Optional<FactFinancial> findLatestByTickerAndType(
            @Param("tickerId") String tickerId,
            @Param("reportType") String reportType);
}
