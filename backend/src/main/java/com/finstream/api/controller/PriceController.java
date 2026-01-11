package com.finstream.api.controller;

import com.finstream.api.dto.PriceDailyDto;
import com.finstream.api.service.FactPriceDailyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/tickers/{tickerId}/prices")
@RequiredArgsConstructor
public class PriceController {
    private final FactPriceDailyService factPriceDailyService;

    @GetMapping
    public ResponseEntity<Page<PriceDailyDto>> getPrices(
            @PathVariable String tickerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "365") int size) {
        
        if (from == null) {
            from = LocalDate.now().minusDays(365);
        }
        if (to == null) {
            to = LocalDate.now();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("date").ascending());
        Page<PriceDailyDto> prices = factPriceDailyService.getPricesByDateRange(tickerId, from, to, pageable);
        return ResponseEntity.ok(prices);
    }

    @GetMapping("/latest")
    public ResponseEntity<PriceDailyDto> getLatestPrice(@PathVariable String tickerId) {
        PriceDailyDto latestPrice = factPriceDailyService.getLatestPrice(tickerId);
        return ResponseEntity.ok(latestPrice);
    }
}
