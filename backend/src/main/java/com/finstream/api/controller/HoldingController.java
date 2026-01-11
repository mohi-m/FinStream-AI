package com.finstream.api.controller;

import com.finstream.api.dto.HoldingDto;
import com.finstream.api.service.PortfolioHoldingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/portfolios/{portfolioId}/holdings")
@RequiredArgsConstructor
public class HoldingController {
    private final PortfolioHoldingService portfolioHoldingService;

    @GetMapping
    public ResponseEntity<Page<HoldingDto>> getHoldings(
            @RequestHeader("X-Firebase-UID") String firebaseUid,
            @PathVariable UUID portfolioId,
            @PageableDefault(size = 20, sort = "tickerId", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<HoldingDto> holdings = portfolioHoldingService.getHoldings(portfolioId, firebaseUid, pageable);
        return ResponseEntity.ok(holdings);
    }

    @PostMapping
    public ResponseEntity<HoldingDto> addHolding(
            @RequestHeader("X-Firebase-UID") String firebaseUid,
            @PathVariable UUID portfolioId,
            @Valid @RequestBody HoldingDto dto) {
        HoldingDto createdHolding = portfolioHoldingService.addHolding(portfolioId, firebaseUid, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdHolding);
    }

    @PutMapping("/{tickerId}")
    public ResponseEntity<HoldingDto> updateHolding(
            @RequestHeader("X-Firebase-UID") String firebaseUid,
            @PathVariable UUID portfolioId,
            @PathVariable String tickerId,
            @Valid @RequestBody HoldingDto dto) {
        HoldingDto updatedHolding = portfolioHoldingService.updateHolding(portfolioId, firebaseUid, tickerId, dto);
        return ResponseEntity.ok(updatedHolding);
    }

    @DeleteMapping("/{tickerId}")
    public ResponseEntity<Void> deleteHolding(
            @RequestHeader("X-Firebase-UID") String firebaseUid,
            @PathVariable UUID portfolioId,
            @PathVariable String tickerId) {
        portfolioHoldingService.deleteHolding(portfolioId, firebaseUid, tickerId);
        return ResponseEntity.noContent().build();
    }
}
