package com.finstream.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTOs for the portfolio RAG commentary endpoint.
 */
public final class CommentaryDto {

    private CommentaryDto() {}

    /**
     * Response for the whole portfolio commentary.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PortfolioCommentaryResponse {
        private UUID portfolioId;
        private String portfolioName;
        private List<TickerCommentary> commentaries;
        private LocalDateTime generatedAt;
    }

    /**
     * Commentary generated for a single ticker.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TickerCommentary {
        private String tickerId;
        private String companyName;
        private String sector;
        private String commentary;
        private Integer filingYear;
        private Integer chunksUsed;
    }

    /**
     * Internal DTO representing a retrieved SEC filing chunk from the vector DB.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SecFilingChunk {
        private String ticker;
        private int filingYear;
        private String filingType;
        private String filingPeriod;
        private String itemCode;
        private int chunkIndex;
        private String chunkText;
        private double similarity;
    }
}
