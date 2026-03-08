package com.finstream.api.service;

import com.finstream.api.dto.CommentaryDto.PortfolioCommentaryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class PortfolioCommentaryService {

    private final PortfolioCommentaryGraphService commentaryGraphService;

    @Cacheable(cacheNames = "portfolioCommentary", key = "#portfolioId.toString() + ':' + #firebaseUid", sync = true)
    public PortfolioCommentaryResponse generateCommentary(UUID portfolioId, String firebaseUid) {
        return commentaryGraphService.generateCommentary(portfolioId, firebaseUid);
    }

    @CachePut(cacheNames = "portfolioCommentary", key = "#portfolioId.toString() + ':' + #firebaseUid")
    public PortfolioCommentaryResponse generateCommentaryBypassingCache(UUID portfolioId, String firebaseUid) {
        log.info("Regenerating commentary while bypassing cache for portfolio {} (user={})", portfolioId, firebaseUid);
        return commentaryGraphService.generateCommentary(portfolioId, firebaseUid);
    }
}
