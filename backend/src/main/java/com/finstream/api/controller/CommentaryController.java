package com.finstream.api.controller;

import com.finstream.api.AssistantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class CommentaryController {

    private final AssistantService assistantService;

    @GetMapping("/ai/recommendation")
    public String chat(@RequestParam(value="message", defaultValue="Hello") String message) {
        return assistantService.chat(message);
    }


}
