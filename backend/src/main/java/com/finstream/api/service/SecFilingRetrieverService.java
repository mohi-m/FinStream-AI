package com.finstream.api.service;

import com.finstream.api.dto.CommentaryDto.SecFilingChunk;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Retrieves relevant SEC filing chunks from the pgvector database
 * using cosine similarity search, filtered by ticker.
 */
@Service
@Slf4j
public class SecFilingRetrieverService {

    private final JdbcTemplate vectorJdbc;
    private final EmbeddingModel embeddingModel;
    private final int maxChunks;

    /**
     * SQL uses the cosine-distance operator {@code <=>} provided by pgvector.
     * Similarity = 1 − cosine_distance.
     */
    private static final String SIMILARITY_SEARCH_SQL = """
            SELECT ticker, filing_year, filing_type, filing_period,
                   item_code, chunk_index, chunk_text,
                   1 - (embedding <=> ?::vector) AS similarity
              FROM sec_filing_chunks
             WHERE ticker = ?
             ORDER BY embedding <=> ?::vector
             LIMIT ?
            """;

    private static final String SIMILARITY_SEARCH_BY_YEAR_SQL = """
            SELECT ticker, filing_year, filing_type, filing_period,
                   item_code, chunk_index, chunk_text,
                   1 - (embedding <=> ?::vector) AS similarity
              FROM sec_filing_chunks
             WHERE ticker = ?
               AND filing_year = ?
             ORDER BY embedding <=> ?::vector
             LIMIT ?
            """;

    public SecFilingRetrieverService(
            @Qualifier("vectorJdbcTemplate") JdbcTemplate vectorJdbc,
            EmbeddingModel embeddingModel,
            @Value("${commentary.retrieval.max-chunks:15}") int maxChunks) {
        this.vectorJdbc = vectorJdbc;
        this.embeddingModel = embeddingModel;
        this.maxChunks = maxChunks;
    }

    /**
     * Retrieve the most relevant SEC filing chunks for a ticker.
     *
     * @param ticker  stock ticker, e.g. "AAPL"
     * @param query   natural-language query used to embed and search
     * @return ordered list of matching chunks (highest similarity first)
     */
    public List<SecFilingChunk> retrieve(String ticker, String query) {
        return retrieve(ticker, query, null);
    }

    /**
     * Retrieve relevant chunks, optionally filtered to a specific filing year.
     */
    public List<SecFilingChunk> retrieve(String ticker, String query, Integer filingYear) {
        log.debug("Embedding query for ticker={}, filingYear={}", ticker, filingYear);

        // Embed the query using the same model used at ingestion time (text-embedding-3-small)
        float[] queryEmbedding = embeddingModel
                .embed(TextSegment.from(query))
                .content()
                .vector();

        String vectorLiteral = toVectorLiteral(queryEmbedding);

        List<SecFilingChunk> chunks;
        if (filingYear != null) {
            chunks = vectorJdbc.query(
                    SIMILARITY_SEARCH_BY_YEAR_SQL,
                    (rs, rowNum) -> SecFilingChunk.builder()
                            .ticker(rs.getString("ticker"))
                            .filingYear(rs.getInt("filing_year"))
                            .filingType(rs.getString("filing_type"))
                            .filingPeriod(rs.getString("filing_period"))
                            .itemCode(rs.getString("item_code"))
                            .chunkIndex(rs.getInt("chunk_index"))
                            .chunkText(rs.getString("chunk_text"))
                            .similarity(rs.getDouble("similarity"))
                            .build(),
                    vectorLiteral, ticker, filingYear, vectorLiteral, maxChunks);
        } else {
            chunks = vectorJdbc.query(
                    SIMILARITY_SEARCH_SQL,
                    (rs, rowNum) -> SecFilingChunk.builder()
                            .ticker(rs.getString("ticker"))
                            .filingYear(rs.getInt("filing_year"))
                            .filingType(rs.getString("filing_type"))
                            .filingPeriod(rs.getString("filing_period"))
                            .itemCode(rs.getString("item_code"))
                            .chunkIndex(rs.getInt("chunk_index"))
                            .chunkText(rs.getString("chunk_text"))
                            .similarity(rs.getDouble("similarity"))
                            .build(),
                    vectorLiteral, ticker, vectorLiteral, maxChunks);
        }

        log.debug("Retrieved {} chunks for ticker={} (top similarity={})",
                chunks.size(), ticker,
                chunks.isEmpty() ? "N/A" : String.format("%.4f", chunks.get(0).getSimilarity()));

        return chunks;
    }

    /**
     * Converts a float[] embedding into the pgvector literal format {@code [0.1,0.2,...]}.
     */
    private String toVectorLiteral(float[] embedding) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(embedding[i]);
        }
        sb.append(']');
        return sb.toString();
    }
}
