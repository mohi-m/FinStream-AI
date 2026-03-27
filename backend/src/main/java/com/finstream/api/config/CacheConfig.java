package com.finstream.api.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class CacheConfig {

    private static final Duration TICKER_CACHE_TTL = Duration.ofHours(1);
    private static final Duration PORTFOLIO_COMMENTARY_CACHE_TTL = Duration.ofHours(24);

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.registerCustomCache("tickerById", buildOneHourCache());
        cacheManager.registerCustomCache("tickerSectors", buildOneHourCache());
        cacheManager.registerCustomCache("topTickersByWeeklyGain", buildOneHourCache());
        cacheManager.registerCustomCache("portfolioCommentary", buildPortfolioCommentaryCache());
        cacheManager.setAllowNullValues(false);
        return cacheManager;
    }

    private Cache<Object, Object> buildOneHourCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(TICKER_CACHE_TTL)
                .build();
    }

    private Cache<Object, Object> buildPortfolioCommentaryCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(PORTFOLIO_COMMENTARY_CACHE_TTL)
                .build();
    }
}
