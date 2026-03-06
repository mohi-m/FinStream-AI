package com.finstream.api.repository;

import com.finstream.api.entity.DimTicker;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DimTickerRepository extends JpaRepository<DimTicker, String> {
    Page<DimTicker> findByTickerIdContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(
            String tickerId, String companyName, Pageable pageable);

    @Query("""
            SELECT DISTINCT d.sector
            FROM DimTicker d
            WHERE d.sector IS NOT NULL AND d.sector <> ''
            ORDER BY d.sector
            """)
    List<String> findDistinctSectors();

    @Query(value = """
            SELECT dt.*
            FROM dim_ticker dt
                JOIN (
                SELECT DISTINCT ON (ticker_id)
                    ticker_id,
                    date,
                    volume
                FROM fact_price_daily
                ORDER BY ticker_id, date DESC
                ) fp ON fp.ticker_id = dt.ticker_id
                WHERE dt.ticker_id NOT LIKE '^%'
                  AND (:sector IS NULL OR dt.sector = :sector)
                ORDER BY fp.volume DESC NULLS LAST
            LIMIT :limit
            """, nativeQuery = true)
    List<DimTicker> findTopTickersByLatestVolume(
            @Param("sector") String sector,
            @Param("limit") int limit);
}
