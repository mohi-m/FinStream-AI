package com.finstream.api.controller;

import com.finstream.api.dto.CommentaryDto.PortfolioCommentaryResponse;
import com.finstream.api.service.PortfolioCommentaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST endpoint for generating AI-powered investment commentary
 * on every ticker held in a portfolio, using RAG over SEC filings.
 */
@RestController
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class CommentaryController {

    private final PortfolioCommentaryService commentaryService;

    /**
     * Generate investment commentary for all holdings in a portfolio.
     *
     * <p>
     * Retrieves relevant SEC filing 10-K/10-Q chunks from the vector DB
     * for each ticker and passes them to the LLM to produce commentary.
     *
     * @param firebaseUid user identity (from request header)
     * @param portfolioId portfolio to analyse
     * @return commentary per ticker
     */
    @GetMapping("/{portfolioId}/commentary")
    public ResponseEntity<PortfolioCommentaryResponse> getCommentary(
            @RequestHeader("X-Firebase-UID") String firebaseUid,
            @PathVariable UUID portfolioId) {

        PortfolioCommentaryResponse response = commentaryService.generateCommentary(portfolioId, firebaseUid);
        return ResponseEntity.ok(response);
    }

    /**
     * Force commentary regeneration while bypassing the cached response.
     *
     * <p>
     * This endpoint always calls the LLM pipeline and refreshes the cache entry
     * for subsequent reads.
     *
     * @param firebaseUid user identity (from request header)
     * @param portfolioId portfolio to analyse
     * @return freshly generated commentary per ticker
     */
    @PostMapping("/{portfolioId}/commentary/refresh")
    public ResponseEntity<PortfolioCommentaryResponse> refreshCommentary(
            @RequestHeader("X-Firebase-UID") String firebaseUid,
            @PathVariable UUID portfolioId) {

        PortfolioCommentaryResponse response = commentaryService
                .generateCommentaryBypassingCache(portfolioId, firebaseUid);
        return ResponseEntity.ok(response);
    }
}
