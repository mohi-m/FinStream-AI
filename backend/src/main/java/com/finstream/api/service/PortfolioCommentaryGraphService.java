package com.finstream.api.service;

import com.finstream.api.dto.CommentaryDto.PortfolioCommentaryResponse;
import com.finstream.api.dto.CommentaryDto.SecFilingChunk;
import com.finstream.api.dto.CommentaryDto.TickerCommentary;
import com.finstream.api.entity.DimTicker;
import com.finstream.api.entity.PortfolioHolding;
import com.finstream.api.entity.UserPortfolio;
import com.finstream.api.exception.ResourceNotFoundException;
import com.finstream.api.repository.DimTickerRepository;
import com.finstream.api.repository.PortfolioHoldingRepository;
import com.finstream.api.repository.UserPortfolioRepository;
import lombok.extern.slf4j.Slf4j;
import org.bsc.langgraph4j.CompiledGraph;
import org.bsc.langgraph4j.GraphStateException;
import org.bsc.langgraph4j.StateGraph;
import org.bsc.langgraph4j.state.AgentState;
import org.bsc.langgraph4j.state.Channel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PreDestroy;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import static org.bsc.langgraph4j.StateGraph.END;
import static org.bsc.langgraph4j.StateGraph.START;
import static org.bsc.langgraph4j.action.AsyncEdgeAction.edge_async;
import static org.bsc.langgraph4j.action.AsyncNodeAction.node_async;

@Service
@Transactional(readOnly = true)
@Slf4j
public class PortfolioCommentaryGraphService {

    private final UserPortfolioRepository portfolioRepository;
    private final PortfolioHoldingRepository holdingRepository;
    private final DimTickerRepository tickerRepository;
    private final SecFilingRetrieverService retrieverService;
    private final TickerCommentaryAiService aiService;
    private final int maxParallelWorkers;
    private final ExecutorService tickerFanOutExecutor;

    private final CompiledGraph<CommentaryGraphState> commentaryGraph;

    private static final String ANALYSIS_QUERY = "financial performance revenue growth profitability risk factors " +
            "legal proceedings regulatory concerns market risk interest rate " +
            "foreign exchange commodity exposure management discussion analysis";

    public PortfolioCommentaryGraphService(
            UserPortfolioRepository portfolioRepository,
            PortfolioHoldingRepository holdingRepository,
            DimTickerRepository tickerRepository,
            SecFilingRetrieverService retrieverService,
            TickerCommentaryAiService aiService,
            @Value("${commentary.parallel.max-workers:4}") int maxParallelWorkers) {
        this.portfolioRepository = portfolioRepository;
        this.holdingRepository = holdingRepository;
        this.tickerRepository = tickerRepository;
        this.retrieverService = retrieverService;
        this.aiService = aiService;
        this.maxParallelWorkers = Math.max(1, maxParallelWorkers);
        this.tickerFanOutExecutor = Executors.newFixedThreadPool(
                this.maxParallelWorkers,
                new TickerWorkerThreadFactory());
        this.commentaryGraph = buildGraph();
    }

    @PreDestroy
    void shutdownTickerFanOutExecutor() {
        tickerFanOutExecutor.shutdown();
        try {
            if (!tickerFanOutExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                tickerFanOutExecutor.shutdownNow();
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            tickerFanOutExecutor.shutdownNow();
        }
    }

    public PortfolioCommentaryResponse generateCommentary(UUID portfolioId, String firebaseUid) {
        log.info("Generating commentary via graph for portfolio {} (user={})", portfolioId, firebaseUid);

        CommentaryGraphState finalState = commentaryGraph
                .invoke(Map.of(
                        CommentaryGraphState.PORTFOLIO_ID, portfolioId,
                        CommentaryGraphState.FIREBASE_UID, firebaseUid))
                .orElseThrow(() -> new IllegalStateException("Commentary graph produced no result"));

        return PortfolioCommentaryResponse.builder()
                .portfolioId(finalState.portfolioId().orElse(portfolioId))
                .portfolioName(finalState.portfolioName().orElse("Portfolio"))
                .portfolioOverview(finalState.portfolioOverview().orElse(null))
                .commentaries(toTickerCommentaries(finalState.commentaryEntries()))
                .generatedAt(finalState.generatedAt().orElse(LocalDateTime.now()))
                .build();
    }

    private CompiledGraph<CommentaryGraphState> buildGraph() {
        try {
            return new StateGraph<>(CommentaryGraphState.SCHEMA, CommentaryGraphState::new)
                    .addNode("loadPortfolio", node_async(this::loadPortfolio))
                    .addNode("generateTickerCommentariesParallel", node_async(this::generateTickerCommentariesParallel))
                    .addNode("buildPortfolioOverview", node_async(this::buildPortfolioOverview))
                    .addEdge(START, "loadPortfolio")
                    .addConditionalEdges(
                            "loadPortfolio",
                            edge_async(this::routeAfterLoadPortfolio),
                            Map.of(
                                    "generateTickerCommentariesParallel", "generateTickerCommentariesParallel",
                                    "buildPortfolioOverview", "buildPortfolioOverview"))
                    .addEdge("generateTickerCommentariesParallel", "buildPortfolioOverview")
                    .addEdge("buildPortfolioOverview", END)
                    .compile();
        } catch (GraphStateException ex) {
            throw new IllegalStateException("Failed to initialize portfolio commentary graph", ex);
        }
    }

    private Map<String, Object> loadPortfolio(CommentaryGraphState state) {
        UUID portfolioId = state.portfolioId()
                .orElseThrow(() -> new IllegalStateException("Missing portfolioId in graph state"));
        String firebaseUid = state.firebaseUid()
                .orElseThrow(() -> new IllegalStateException("Missing firebaseUid in graph state"));

        UserPortfolio portfolio = portfolioRepository
                .findByPortfolioIdAndFirebaseUid(portfolioId, firebaseUid)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found"));

        List<PortfolioHolding> holdings = holdingRepository.findAllByPortfolioId(portfolioId);
        List<String> tickerIds = holdings.stream()
                .map(h -> h.getId().getTickerId())
                .toList();

        return Map.of(
                CommentaryGraphState.PORTFOLIO_ID, portfolioId,
                CommentaryGraphState.FIREBASE_UID, firebaseUid,
                CommentaryGraphState.PORTFOLIO_NAME, portfolio.getPortfolioName(),
                CommentaryGraphState.TICKER_IDS, tickerIds);
    }

    private String routeAfterLoadPortfolio(CommentaryGraphState state) {
        return state.tickerIds().isEmpty()
                ? "buildPortfolioOverview"
                : "generateTickerCommentariesParallel";
    }

    private Map<String, Object> generateTickerCommentariesParallel(CommentaryGraphState state) {
        List<String> tickerIds = state.tickerIds();
        if (tickerIds.isEmpty()) {
            return Map.of(CommentaryGraphState.COMMENTARIES, List.of());
        }

        log.debug("Generating commentary for {} tickers with up to {} parallel workers",
                tickerIds.size(), maxParallelWorkers);

        List<CompletableFuture<TickerCommentary>> futures = tickerIds.stream()
                .map(tickerId -> CompletableFuture.supplyAsync(
                        () -> safeGenerateForTicker(tickerId),
                        tickerFanOutExecutor))
                .toList();

        List<Map<String, Object>> commentaryEntries = futures.stream()
                .map(CompletableFuture::join)
                .map(this::toStateCommentaryEntry)
                .toList();

        return Map.of(CommentaryGraphState.COMMENTARIES, commentaryEntries);
    }

    private TickerCommentary safeGenerateForTicker(String tickerId) {
        try {
            return generateForTicker(tickerId);
        } catch (Exception ex) {
            log.error("Failed to generate commentary for ticker={}: {}", tickerId, ex.getMessage(), ex);
            return TickerCommentary.builder()
                    .tickerId(tickerId)
                    .commentary("Commentary could not be generated: " + ex.getMessage())
                    .chunksUsed(0)
                    .build();
        }
    }

    private Map<String, Object> buildPortfolioOverview(CommentaryGraphState state) {
        if (state.tickerIds().isEmpty()) {
            return Map.of(CommentaryGraphState.GENERATED_AT, LocalDateTime.now());
        }

        List<TickerCommentary> commentaries = toTickerCommentaries(state.commentaryEntries());
        String overview = generatePortfolioOverview(
                state.portfolioName().orElse("Portfolio"),
                commentaries);

        return Map.of(
                CommentaryGraphState.PORTFOLIO_OVERVIEW, overview,
                CommentaryGraphState.GENERATED_AT, LocalDateTime.now());
    }

    /**
     * Persisting plain map data in graph state avoids DevTools classloader casting
     * issues.
     */
    private Map<String, Object> toStateCommentaryEntry(TickerCommentary commentary) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("tickerId", commentary.getTickerId());
        data.put("companyName", commentary.getCompanyName());
        data.put("sector", commentary.getSector());
        data.put("commentary", commentary.getCommentary());
        data.put("filingYear", commentary.getFilingYear());
        data.put("chunksUsed", commentary.getChunksUsed());
        return data;
    }

    private List<TickerCommentary> toTickerCommentaries(List<Object> entries) {
        return entries.stream()
                .map(this::toTickerCommentary)
                .toList();
    }

    @SuppressWarnings("unchecked")
    private TickerCommentary toTickerCommentary(Object entry) {
        if (entry instanceof TickerCommentary commentary) {
            return commentary;
        }
        if (entry instanceof Map<?, ?> map) {
            return TickerCommentary.builder()
                    .tickerId(asString(map.get("tickerId")))
                    .companyName(asString(map.get("companyName")))
                    .sector(asString(map.get("sector")))
                    .commentary(asString(map.get("commentary")))
                    .filingYear(asInteger(map.get("filingYear")))
                    .chunksUsed(asInteger(map.get("chunksUsed")))
                    .build();
        }

        // Transitional fallback in case a restart left a foreign-loader DTO instance.
        if (entry != null && entry.getClass().getName().equals(TickerCommentary.class.getName())) {
            try {
                Class<?> clazz = entry.getClass();
                return TickerCommentary.builder()
                        .tickerId(asString(clazz.getMethod("getTickerId").invoke(entry)))
                        .companyName(asString(clazz.getMethod("getCompanyName").invoke(entry)))
                        .sector(asString(clazz.getMethod("getSector").invoke(entry)))
                        .commentary(asString(clazz.getMethod("getCommentary").invoke(entry)))
                        .filingYear(asInteger(clazz.getMethod("getFilingYear").invoke(entry)))
                        .chunksUsed(asInteger(clazz.getMethod("getChunksUsed").invoke(entry)))
                        .build();
            } catch (ReflectiveOperationException ex) {
                throw new IllegalStateException("Unable to read ticker commentary from graph state", ex);
            }
        }

        throw new IllegalStateException("Unsupported commentary entry in graph state: " +
                (entry == null ? "null" : entry.getClass().getName()));
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Integer asInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.valueOf(String.valueOf(value));
    }

    private String generatePortfolioOverview(String portfolioName,
            List<TickerCommentary> commentaries) {
        List<TickerCommentary> valid = commentaries.stream()
                .filter(c -> c.getChunksUsed() != null && c.getChunksUsed() > 0)
                .toList();

        if (valid.isEmpty()) {
            return "No sufficient filing data across holdings to produce a portfolio overview.";
        }

        StringBuilder sb = new StringBuilder();
        for (TickerCommentary tc : valid) {
            sb.append(String.format("### %s - %s (%s)%n",
                    tc.getTickerId(), tc.getCompanyName(), tc.getSector()));
            sb.append(tc.getCommentary());
            sb.append("\n\n---\n\n");
        }

        try {
            return aiService.generatePortfolioOverview(portfolioName, sb.toString());
        } catch (Exception ex) {
            log.error("Failed to generate portfolio overview: {}", ex.getMessage(), ex);
            return "Portfolio overview could not be generated: " + ex.getMessage();
        }
    }

    private TickerCommentary generateForTicker(String tickerId) {
        log.debug("Generating commentary for ticker={}", tickerId);

        String companyName = tickerId;
        String sector = "Unknown";
        var tickerOpt = tickerRepository.findById(tickerId);
        if (tickerOpt.isPresent()) {
            DimTicker dim = tickerOpt.get();
            companyName = dim.getCompanyName() != null ? dim.getCompanyName() : tickerId;
            sector = dim.getSector() != null ? dim.getSector() : "Unknown";
        }

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

        String context = formatChunksAsContext(chunks);

        int filingYear = chunks.stream()
                .collect(Collectors.groupingBy(SecFilingChunk::getFilingYear, Collectors.counting()))
                .entrySet().stream()
                .max(java.util.Map.Entry.comparingByValue())
                .map(java.util.Map.Entry::getKey)
                .orElse(0);

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

    private String formatChunksAsContext(List<SecFilingChunk> chunks) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < chunks.size(); i++) {
            SecFilingChunk c = chunks.get(i);
            sb.append(String.format("[Source: %s %d %s - %s]%n",
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
            case "item_3" -> "Item 3: Legal Proceedings";
            case "item_7" -> "Item 7: MD&A";
            case "item_7a" -> "Item 7A: Market Risk Disclosures";
            default -> itemCode;
        };
    }

    static class CommentaryGraphState extends AgentState {
        static final String PORTFOLIO_ID = "portfolioId";
        static final String FIREBASE_UID = "firebaseUid";
        static final String PORTFOLIO_NAME = "portfolioName";
        static final String TICKER_IDS = "tickerIds";
        static final String COMMENTARIES = "commentaries";
        static final String PORTFOLIO_OVERVIEW = "portfolioOverview";
        static final String GENERATED_AT = "generatedAt";

        static final Map<String, Channel<?>> SCHEMA = Map.of();

        CommentaryGraphState(Map<String, Object> initData) {
            super(initData);
        }

        java.util.Optional<UUID> portfolioId() {
            return value(PORTFOLIO_ID);
        }

        java.util.Optional<String> firebaseUid() {
            return value(FIREBASE_UID);
        }

        java.util.Optional<String> portfolioName() {
            return value(PORTFOLIO_NAME);
        }

        @SuppressWarnings("unchecked")
        List<String> tickerIds() {
            return this.<List<String>>value(TICKER_IDS).orElse(List.of());
        }

        @SuppressWarnings("unchecked")
        List<Object> commentaryEntries() {
            return this.<List<Object>>value(COMMENTARIES).orElse(List.of());
        }

        java.util.Optional<String> portfolioOverview() {
            return value(PORTFOLIO_OVERVIEW);
        }

        java.util.Optional<LocalDateTime> generatedAt() {
            return value(GENERATED_AT);
        }
    }

    static class TickerWorkerThreadFactory implements ThreadFactory {
        private final AtomicInteger workerId = new AtomicInteger(1);

        @Override
        public Thread newThread(Runnable runnable) {
            Thread thread = new Thread(runnable);
            thread.setName("commentary-ticker-worker-" + workerId.getAndIncrement());
            thread.setDaemon(true);
            return thread;
        }
    }
}
