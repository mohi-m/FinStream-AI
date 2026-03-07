package com.finstream.api.controller;

import com.finstream.api.dto.TickerDto;
import com.finstream.api.service.DimTickerService;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickers")
@RequiredArgsConstructor
public class TickerController {
    private final DimTickerService dimTickerService;

    @GetMapping
    public ResponseEntity<Page<TickerDto>> searchTickers(
            @RequestParam(defaultValue = "Apple") String query,
            @ParameterObject @PageableDefault(size = 20, sort = "tickerId", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<TickerDto> tickers = dimTickerService.searchTickers(query, pageable);
        return ResponseEntity.ok(tickers);
    }

    @GetMapping("/top")
    public ResponseEntity<List<TickerDto>> getTopTickers(
            @RequestParam(defaultValue = "5") Integer limit,
            @RequestParam(required = false) String sector) {
        return ResponseEntity.ok(dimTickerService.getTopTickersByWeeklyGain(limit, sector));
    }

    @GetMapping("/sectors")
    public ResponseEntity<List<String>> getSectors() {
        return ResponseEntity.ok(dimTickerService.getSectors());
    }

    @GetMapping("/{tickerId}")
    public ResponseEntity<TickerDto> getTicker(@PathVariable String tickerId) {
        TickerDto ticker = dimTickerService.getTicker(tickerId);
        return ResponseEntity.ok(ticker);
    }
}
