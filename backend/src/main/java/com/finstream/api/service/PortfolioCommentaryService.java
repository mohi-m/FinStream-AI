package com.finstream.api.service;

import com.finstream.api.dto.CommentaryDto.PortfolioCommentaryResponse;
import com.finstream.api.dto.CommentaryDto.SecFilingChunk;
import com.finstream.api.dto.CommentaryDto.TickerCommentary;
import com.finstream.api.entity.DimTicker;
import com.finstream.api.entity.PortfolioHolding;
import com.finstream.api.entity.UserPortfolio;
import com.finstream.api.exception.ResourceNotFoundException;
import com.finstream.api.exception.UnauthorizedAccessException;
import com.finstream.api.repository.DimTickerRepository;
import com.finstream.api.repository.PortfolioHoldingRepository;
import com.finstream.api.repository.UserPortfolioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Orchestrates RAG-based commentary generation for every holding in a portfolio.
 *
 * <p>Flow per ticker:
 * <ol>
 *   <li>Embed a broad financial-analysis query via {@link SecFilingRetrieverService}.</li>
 *   <li>Retrieve top-N SEC filing chunks from the pgvector database.</li>
 *   <li>Pass the chunks as context to the LLM via {@link TickerCommentaryAiService}.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class PortfolioCommentaryService {

    private final UserPortfolioRepository portfolioRepository;
    private final PortfolioHoldingRepository holdingRepository;
    private final DimTickerRepository tickerRepository;
    private final SecFilingRetrieverService retrieverService;
    private final TickerCommentaryAiService aiService;

    /**
     * The query embedded and sent to the vector DB for similarity search.
     * Intentionally broad so that it surfaces the most relevant excerpts
     * across Items 1A, 3, 7 and 7A.
     */
    private static final String ANALYSIS_QUERY =
            "financial performance revenue growth profitability risk factors " +
            "legal proceedings regulatory concerns market risk interest rate " +
            "foreign exchange commodity exposure management discussion analysis";

    /**
     * Generate investment commentary for every ticker held in the given portfolio.
     *
     * @param portfolioId  UUID of the portfolio
     * @param firebaseUid  authenticated user's Firebase UID
     * @return complete commentary response
     */
    public PortfolioCommentaryResponse generateCommentary(UUID portfolioId, String firebaseUid) {
        log.info("Generating commentary for portfolio {} (user={})", portfolioId, firebaseUid);

        // 1. Verify ownership
        UserPortfolio portfolio = portfolioRepository
                .findByPortfolioIdAndFirebaseUid(portfolioId, firebaseUid)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found"));

        // 2. Fetch all holdings
        List<PortfolioHolding> holdings = holdingRepository.findAllByPortfolioId(portfolioId);
        if (holdings.isEmpty()) {
            log.warn("Portfolio {} has no holdings", portfolioId);
            return PortfolioCommentaryResponse.builder()
                    .portfolioId(portfolioId)
                    .portfolioName(portfolio.getPortfolioName())
                    .commentaries(List.of())
                    .generatedAt(LocalDateTime.now())
                    .build();
        }

        // 3. For each holding, retrieve context & generate commentary
        List<TickerCommentary> commentaries = new ArrayList<>();
        for (PortfolioHolding holding : holdings) {
            String tickerId = holding.getId().getTickerId();
            try {
                TickerCommentary commentary = generateForTicker(tickerId);
                commentaries.add(commentary);
            } catch (Exception ex) {
                log.error("Failed to generate commentary for ticker={}: {}", tickerId, ex.getMessage(), ex);
                commentaries.add(TickerCommentary.builder()
                        .tickerId(tickerId)
                        .commentary("Commentary could not be generated: " + ex.getMessage())
                        .chunksUsed(0)
                        .build());
            }
        }

        return PortfolioCommentaryResponse.builder()
                .portfolioId(portfolioId)
                .portfolioName(portfolio.getPortfolioName())
                .commentaries(commentaries)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    // ------------------------------------------------------------------
    // Private helpers
    // ------------------------------------------------------------------

    private TickerCommentary generateForTicker(String tickerId) {
        log.debug("Generating commentary for ticker={}", tickerId);

        // Look up company metadata (best-effort; fall back to ticker only)
        String companyName = tickerId;
        String sector = "Unknown";
        var tickerOpt = tickerRepository.findById(tickerId);
        if (tickerOpt.isPresent()) {
            DimTicker dim = tickerOpt.get();
            companyName = dim.getCompanyName() != null ? dim.getCompanyName() : tickerId;
            sector = dim.getSector() != null ? dim.getSector() : "Unknown";
        }

        // Retrieve relevant SEC filing chunks
        List<SecFilingChunk> chunks = retrieverService.retrieve(tickerId, ANALYSIS_QUERY);
        if (chunks.isEmpty()) {
            log.warn("No SEC filing data found for ticker={}", tickerId);
            return TickerCommentary.builder()
                    .tickerId(tickerId)
                    .companyName(companyName)
                    .sector(sector)
                    .commentary("No SEC filing data available for this ticker.")
                    .chunksUsed(0)
                    .build();
        }

        // Build context string from retrieved chunks
        String context = formatChunksAsContext(chunks);

        // Determine the most common filing year across retrieved chunks
        int filingYear = chunks.stream()
                .collect(Collectors.groupingBy(SecFilingChunk::getFilingYear, Collectors.counting()))
                .entrySet().stream()
                .max(java.util.Map.Entry.comparingByValue())
                .map(java.util.Map.Entry::getKey)
                .orElse(0);

        // Call the LLM
        String commentary = aiService.generateCommentary(tickerId, companyName, sector, context);

        return TickerCommentary.builder()
                .tickerId(tickerId)
                .companyName(companyName)
                .sector(sector)
                .commentary(commentary)
                .filingYear(filingYear)
                .chunksUsed(chunks.size())
                .build();
    }

    /**
     * Formats retrieved chunks into a single context string for the LLM prompt.
     * Each chunk is prefixed with its source metadata.
     */
    private String formatChunksAsContext(List<SecFilingChunk> chunks) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < chunks.size(); i++) {
            SecFilingChunk c = chunks.get(i);
            sb.append(String.format("[Source: %s %d %s — %s]\n",
                    c.getFilingType(), c.getFilingYear(),
                    c.getFilingPeriod(), humanReadableItem(c.getItemCode())));
            sb.append(c.getChunkText());
            if (i < chunks.size() - 1) {
                sb.append("\n\n---\n\n");
            }
        }
        return sb.toString();
    }

    private String humanReadableItem(String itemCode) {
        return switch (itemCode) {
            case "item_1a" -> "Item 1A: Risk Factors";
            case "item_3"  -> "Item 3: Legal Proceedings";
            case "item_7"  -> "Item 7: MD&A";
            case "item_7a" -> "Item 7A: Market Risk Disclosures";
            default        -> itemCode;
        };
    }
}
