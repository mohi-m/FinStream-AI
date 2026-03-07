package com.finstream.api.repository;

import com.finstream.api.entity.DimTicker;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DimTickerRepository extends JpaRepository<DimTicker, String> {
    interface TopTickerByWeeklyGainProjection {
        String getTickerId();

        String getCompanyName();

        String getSector();

        String getIndustry();

        String getCurrency();

        LocalDateTime getLastUpdated();

        Double getWeeklyPercentChange();
    }

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
            WITH latest_price AS (
                SELECT DISTINCT ON (fp.ticker_id)
                    fp.ticker_id,
                    fp."date" AS latest_date,
                    fp.close AS latest_close
                FROM fact_price_daily fp
                WHERE fp.close IS NOT NULL
                ORDER BY fp.ticker_id, fp."date" DESC
            ),
            weekly_gain AS (
                SELECT
                    lp.ticker_id,
                    ((lp.latest_close - week_start.close) / NULLIF(week_start.close, 0)) * 100.0 AS gain_pct
                FROM latest_price lp
                JOIN LATERAL (
                    SELECT fp2.close
                    FROM fact_price_daily fp2
                    WHERE fp2.ticker_id = lp.ticker_id
                      AND fp2.close IS NOT NULL
                      AND fp2."date" >= lp.latest_date - 7
                      AND fp2."date" < lp.latest_date
                    ORDER BY fp2."date" ASC
                    LIMIT 1
                ) week_start ON TRUE
            )
            SELECT
                dt.ticker_id AS "tickerId",
                dt.company_name AS "companyName",
                dt.sector AS "sector",
                dt.industry AS "industry",
                dt.currency AS "currency",
                dt.last_updated AS "lastUpdated",
                wg.gain_pct AS "weeklyPercentChange"
            FROM dim_ticker dt
            JOIN weekly_gain wg ON wg.ticker_id = dt.ticker_id
            WHERE dt.ticker_id NOT LIKE '^%'
              AND (:sector IS NULL OR dt.sector = :sector)
            ORDER BY wg.gain_pct DESC NULLS LAST
            LIMIT :limit
            """, nativeQuery = true)
    List<TopTickerByWeeklyGainProjection> findTopTickersByWeeklyGain(
            @Param("sector") String sector,
            @Param("limit") int limit);
}
