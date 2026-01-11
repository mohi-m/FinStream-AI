package com.finstream.api.controller;

import com.finstream.api.dto.FinancialDto;
import com.finstream.api.service.FactFinancialService;
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
@RequestMapping("/api/tickers/{tickerId}/financials")
@RequiredArgsConstructor
public class FinancialController {
    private final FactFinancialService factFinancialService;

    @GetMapping
    public ResponseEntity<Page<FinancialDto>> getFinancials(
            @PathVariable String tickerId,
            @RequestParam(required = false, defaultValue = "annual") String reportType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        if (from == null) {
            from = LocalDate.of(1900, 1, 1);
        }
        if (to == null) {
            to = LocalDate.now();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("id.reportDate").ascending());
        Page<FinancialDto> financials = factFinancialService.getFinancialsByDateRange(tickerId, reportType, from, to, pageable);
        return ResponseEntity.ok(financials);
    }

    @GetMapping("/latest")
    public ResponseEntity<FinancialDto> getLatestFinancial(
            @PathVariable String tickerId,
            @RequestParam(required = false, defaultValue = "annual") String reportType) {
        FinancialDto latestFinancial = factFinancialService.getLatestFinancial(tickerId, reportType);
        return ResponseEntity.ok(latestFinancial);
    }
}
