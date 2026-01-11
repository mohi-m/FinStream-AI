package com.finstream.api.controller;

import com.finstream.api.dto.PortfolioDto;
import com.finstream.api.service.UserPortfolioService;
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
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class PortfolioController {
    private final UserPortfolioService userPortfolioService;

    @GetMapping
    public ResponseEntity<Page<PortfolioDto>> getPortfolios(
            @RequestHeader("X-Firebase-UID") String firebaseUid,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PortfolioDto> portfolios = userPortfolioService.getUserPortfolios(firebaseUid, pageable);
        return ResponseEntity.ok(portfolios);
    }

    @PostMapping
    public ResponseEntity<PortfolioDto> createPortfolio(
            @RequestHeader("X-Firebase-UID") String firebaseUid,
            @Valid @RequestBody PortfolioDto dto) {
        PortfolioDto createdPortfolio = userPortfolioService.createPortfolio(firebaseUid, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPortfolio);
    }

    @GetMapping("/{portfolioId}")
    public ResponseEntity<PortfolioDto> getPortfolio(
            @RequestHeader("X-Firebase-UID") String firebaseUid,
            @PathVariable UUID portfolioId) {
        PortfolioDto portfolio = userPortfolioService.getPortfolio(portfolioId, firebaseUid);
        return ResponseEntity.ok(portfolio);
    }

    @PutMapping("/{portfolioId}")
    public ResponseEntity<PortfolioDto> updatePortfolio(
            @RequestHeader("X-Firebase-UID") String firebaseUid,
            @PathVariable UUID portfolioId,
            @Valid @RequestBody PortfolioDto dto) {
        PortfolioDto updatedPortfolio = userPortfolioService.updatePortfolio(portfolioId, firebaseUid, dto);
        return ResponseEntity.ok(updatedPortfolio);
    }

    @DeleteMapping("/{portfolioId}")
    public ResponseEntity<Void> deletePortfolio(
            @RequestHeader("X-Firebase-UID") String firebaseUid,
            @PathVariable UUID portfolioId) {
        userPortfolioService.deletePortfolio(portfolioId, firebaseUid);
        return ResponseEntity.noContent().build();
    }
}
