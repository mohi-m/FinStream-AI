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
            (10-K) for a publicly traded company, produce a concise yet insightful \
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
            - Keep total length between 140 to 180 words.
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
            You are a senior portfolio strategist writing insights for a consumer investment app.
            Given analyst commentaries for each position, produce a clear portfolio summary
            that a non-expert investor can easily understand.
            
            Your response must be formatted as valid Markdown.
            
            Formatting rules:
            - Each section must contain one short paragraph of 2 to 3 sentences.
            - Do not use bullet points or numbered lists.
            - Do not use em dashes (—). Use normal punctuation such as commas or periods.
            - Keep the language simple and accessible.
            - Reference tickers when relevant.
            - Total response must be under 150 words.
            - Do not repeat the individual commentaries verbatim.
            
            Content guidelines:
            
            ## Portfolio Health - <Healthy, Well Diversified, Moderately Concentrated, or Highly Concentrated>
            Explain briefly why the portfolio falls into that category.
            
            ## Top Sector - <sector name>
            explain why it dominates.
            
            ## Biggest Risk - <main risk phrase>
            Explain the reason behind the risk.
            
            ## Diversification Score - <score out of 10 written as X/10>
            Briefly explain what types of assets or sectors are missing that could improve diversification.
            """)
        @UserMessage("""
            Portfolio: {{portfolioName}}
            
            === Individual Position Commentaries ===
            {{commentaries}}
            =========================================
            
            Produce the portfolio overview now as properly formatted Markdown.
            """)
        String generatePortfolioOverview(
                @V("portfolioName") String portfolioName,
                @V("commentaries") String commentaries);
}
