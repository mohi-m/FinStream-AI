package com.finstream.api;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.spring.AiService;

@AiService
public interface AssistantService {

    @SystemMessage("You are are financial assistant")
    String chat(String userMessage);
}
