package com.finstream.api.service;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

/**
 * LangChain4j AI Service interface for generating per-ticker investment
 * commentary
 * from retrieved SEC filing context.
 * <p>
 * The bean is registered in {@link com.finstream.api.config.LangChainConfig}.
 */
public interface TickerCommentaryAiService {

    @SystemMessage("""
            You are a senior equity research analyst. Given excerpts from SEC filings \
            (10-K / 10-Q) for a publicly traded company, produce a concise yet insightful \
            investment commentary.

            Structure your commentary with the following sections:
            1. **Business Overview & Performance** – key takeaways on revenue, profitability, and growth.
            2. **Risk Factors** – the most material risks disclosed.
            3. **Legal & Regulatory** – any notable legal proceedings or regulatory risks.
            4. **Market Risk** – exposure to interest-rate, FX, or commodity risk.
            5. **Analyst Takeaway** – a brief, balanced conclusion summarising the investment thesis.

            Guidelines:
            - Be factual; cite specifics from the filings when possible.
            - If the provided excerpts lack information for a section, state that clearly \
              rather than speculating.
            - Keep total length under 200 words.
            """)
    @UserMessage("""
            Company : {{ticker}} — {{companyName}}
            Sector  : {{sector}}

            === SEC Filing Excerpts ===
            {{context}}
            ===========================

            Produce the investment commentary now.
            """)
    String generateCommentary(
            @V("ticker") String ticker,
            @V("companyName") String companyName,
            @V("sector") String sector,
            @V("context") String context);

    @SystemMessage("""
            You are a senior portfolio strategist. Given individual analyst commentaries \
            for each position in an investment portfolio, produce a holistic portfolio overview.

            Structure your overview with the following sections:
            1. **Portfolio Composition** – summarise what sectors and companies the portfolio holds.
            2. **Key Strengths** – common positive themes across holdings.
            3. **Concentration Risks** – sector, geographic, or single-name concentration concerns.
            4. **Cross-Cutting Risk Factors** – risks that affect multiple holdings simultaneously \
               (e.g., macro, regulatory, interest-rate exposure).
            5. **Diversification Assessment** – how well-diversified the portfolio is and any gaps.
            6. **Overall Verdict** – a balanced, actionable summary for the investor.

            Guidelines:
            - Reference specific tickers when making a point.
            - Be concise; keep total length under 200 words.
            - Do not repeat the individual commentaries verbatim.
            """)
    @UserMessage("""
            Portfolio: {{portfolioName}}

            === Individual Position Commentaries ===
            {{commentaries}}
            =========================================

            Produce the portfolio overview now.
            """)
    String generatePortfolioOverview(
            @V("portfolioName") String portfolioName,
            @V("commentaries") String commentaries);
}
