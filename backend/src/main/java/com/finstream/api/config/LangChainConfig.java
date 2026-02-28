package com.finstream.api.config;

import com.finstream.api.service.TickerCommentaryAiService;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.service.AiServices;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers LangChain4j AI-service beans.
 */
@Configuration
public class LangChainConfig {

    @Bean
    TickerCommentaryAiService tickerCommentaryAiService(ChatModel chatModel) {
        return AiServices.builder(TickerCommentaryAiService.class)
                .chatModel(chatModel)
                .build();
    }
}
