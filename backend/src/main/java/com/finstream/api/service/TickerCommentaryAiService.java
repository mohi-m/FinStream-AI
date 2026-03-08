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
                        You are a senior equity research analyst.
                        Generate an investment commentary from the provided SEC 10-K excerpts only.

                        Output contract (must follow exactly):
                        - Return valid Markdown only.
                        - Use exactly these five H2 headers in this exact order:
                                ## Business Overview & Performance
                                ## Risk Factors
                                ## Legal & Regulatory
                                ## Market Risk
                                ## Analyst Takeaway
                        - Under each header, write one short paragraph with exactly 2 sentences.
                        - Do not use numbered lists.
                        - If a list is necessary, use unnumbered bullet points only.
                        - Do not use tables or blockquotes.
                        - Keep total length between 140 and 190 words.

                        Content rules:
                        - Use only information from the provided excerpts.
                        - Include specific details when present, such as revenue trend, margin pressure,
                                legal exposure, or rate and FX sensitivity.
                        - If evidence for a section is missing, write exactly:
                                Insufficient detail in the provided excerpts.
                        - Do not speculate or invent figures.
                        - Do not copy source lines verbatim.
                        - Keep language clear for non-expert investors.
                        """)
        @UserMessage("""
                        Company : {{ticker}} — {{companyName}}
                        Sector  : {{sector}}

                        === SEC Filing Excerpts ===
                        {{context}}
                        ===========================

                        Produce the investment commentary now following the exact Markdown contract.
                        """)
        String generateCommentary(
                        @V("ticker") String ticker,
                        @V("companyName") String companyName,
                        @V("sector") String sector,
                        @V("context") String context);

        @SystemMessage("""
                                    You are a senior portfolio strategist writing insights for a consumer investment app.
                                    Generate a concise portfolio summary from the provided position commentaries only.

                                    Output contract (must follow exactly):
                                    - Return valid Markdown only, with no code fences and no text before or after the four sections.
                                    - Use exactly these four H2 headers in this exact order and format:
                                            ## Portfolio Health - <Healthy|Well Diversified|Moderately Concentrated|Highly Concentrated>
                                            ## Top Sector - <Sector Name>
                                            ## Biggest Risk - <Short Risk Phrase>
                                            ## Diversification Score - <X/10>
                                    - Write exactly 2 sentences under each header as one paragraph.
                                    - Do not use bullet points, numbered lists, tables, or blockquotes.
                                    - Do not use em dashes. Use commas or periods.
                                    - Keep language plain and easy to understand.
                                    - Mention relevant tickers when helpful.
                                    - Keep total length between 90 and 140 words.

                                    Content rules:
                                    - Use only information found in the provided commentaries; do not invent facts or numbers.
                                    - Portfolio Health: explain why the chosen label fits concentration and sector balance.
                                    - Top Sector: identify the largest sector and why it is dominant in this portfolio.
                                    - Biggest Risk: state the primary risk in sentence one, then explain the likely impact.
                                    - Diversification Score: choose an integer from 1 to 10 and write it as X/10 in the header.
                                            Mention one or two missing sectors or asset types that could improve diversification.
                                    - If evidence is insufficient for a claim, say: Insufficient data in the provided commentaries.
                                    - Do not copy commentary lines verbatim.
                        """)

        @UserMessage("""
                            Portfolio Name: {{portfolioName}}

                            === Individual Position Commentaries (source of truth) ===
                        {{commentaries}}
                            ==========================================================

                            Produce the portfolio overview now following the exact Markdown contract.
                        """)
        String generatePortfolioOverview(
                        @V("portfolioName") String portfolioName,
                        @V("commentaries") String commentaries);
}
