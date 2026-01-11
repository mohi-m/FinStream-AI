package com.finstream.api.service;

import com.finstream.api.dto.HoldingDto;
import com.finstream.api.entity.PortfolioHolding;
import com.finstream.api.entity.PortfolioHolding.PortfolioHoldingId;
import com.finstream.api.entity.UserPortfolio;
import com.finstream.api.exception.DuplicateResourceException;
import com.finstream.api.exception.ResourceNotFoundException;
import com.finstream.api.exception.UnauthorizedAccessException;
import com.finstream.api.repository.PortfolioHoldingRepository;
import com.finstream.api.repository.UserPortfolioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PortfolioHoldingService {
    private final PortfolioHoldingRepository holdingRepository;
    private final UserPortfolioRepository portfolioRepository;

    public Page<HoldingDto> getHoldings(UUID portfolioId, String firebaseUid, Pageable pageable) {
        log.debug("Fetching holdings for portfolio: {} and user: {}, pageable: {}", portfolioId, firebaseUid, pageable);
        // Verify portfolio ownership
        portfolioRepository.findByPortfolioIdAndFirebaseUid(portfolioId, firebaseUid)
                .orElseThrow(() -> {
                    log.warn("Portfolio {} not found for user {}", portfolioId, firebaseUid);
                    return new ResourceNotFoundException("Portfolio not found");
                });

        Page<PortfolioHolding> holdings = holdingRepository.findByPortfolioId(portfolioId, pageable);
        List<HoldingDto> dtos = holdings.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        log.debug("Found {} holdings for portfolio: {}", dtos.size(), portfolioId);
        return new PageImpl<>(dtos, pageable, holdings.getTotalElements());
    }

    public HoldingDto addHolding(UUID portfolioId, String firebaseUid, HoldingDto dto) {
        log.info("Adding holding for ticker {} to portfolio {} for user {}", dto.getTickerId(), portfolioId, firebaseUid);
        // Verify portfolio ownership
        portfolioRepository.findByPortfolioIdAndFirebaseUid(portfolioId, firebaseUid)
                .orElseThrow(() -> {
                    log.warn("Portfolio {} not found for user {} during add holding", portfolioId, firebaseUid);
                    return new ResourceNotFoundException("Portfolio not found");
                });

        PortfolioHoldingId id = new PortfolioHoldingId(portfolioId, dto.getTickerId());
        if (holdingRepository.existsById(id)) {
            log.warn("Holding for ticker {} already exists in portfolio {}", dto.getTickerId(), portfolioId);
            throw new DuplicateResourceException("Holding already exists for this ticker in this portfolio");
        }

        PortfolioHolding holding = new PortfolioHolding();
        holding.setId(id);
        holding.setQuantity(dto.getQuantity());
        holding.setCashBalance(dto.getCashBalance() != null ? dto.getCashBalance() : BigDecimal.ZERO);
        holding.setNotes(dto.getNotes());

        PortfolioHolding saved = holdingRepository.save(holding);
        log.info("Holding added successfully for ticker {}", dto.getTickerId());
        return mapToDto(saved);
    }

    public HoldingDto updateHolding(UUID portfolioId, String firebaseUid, String tickerId, HoldingDto dto) {
        log.info("Updating holding for ticker {} in portfolio {} for user {}", tickerId, portfolioId, firebaseUid);
        // Verify portfolio ownership
        portfolioRepository.findByPortfolioIdAndFirebaseUid(portfolioId, firebaseUid)
                .orElseThrow(() -> {
                    log.warn("Portfolio {} not found for user {} during update holding", portfolioId, firebaseUid);
                    return new ResourceNotFoundException("Portfolio not found");
                });

        PortfolioHoldingId id = new PortfolioHoldingId(portfolioId, tickerId);
        PortfolioHolding holding = holdingRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Holding for ticker {} not found in portfolio {}", tickerId, portfolioId);
                    return new ResourceNotFoundException("Holding not found");
                });

        holding.setQuantity(dto.getQuantity());
        if (dto.getCashBalance() != null) {
            holding.setCashBalance(dto.getCashBalance());
        }
        if (dto.getNotes() != null) {
            holding.setNotes(dto.getNotes());
        }

        PortfolioHolding saved = holdingRepository.save(holding);
        log.debug("Holding updated successfully for ticker {}", tickerId);
        return mapToDto(saved);
    }

    public void deleteHolding(UUID portfolioId, String firebaseUid, String tickerId) {
        log.info("Deleting holding for ticker {} from portfolio {} for user {}", tickerId, portfolioId, firebaseUid);
        // Verify portfolio ownership
        portfolioRepository.findByPortfolioIdAndFirebaseUid(portfolioId, firebaseUid)
                .orElseThrow(() -> {
                    log.warn("Portfolio {} not found for user {} during delete holding", portfolioId, firebaseUid);
                    return new ResourceNotFoundException("Portfolio not found");
                });

        PortfolioHoldingId id = new PortfolioHoldingId(portfolioId, tickerId);
        PortfolioHolding holding = holdingRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Holding for ticker {} not found in portfolio {} during deletion", tickerId, portfolioId);
                    return new ResourceNotFoundException("Holding not found");
                });
        holdingRepository.delete(holding);
        log.info("Holding for ticker {} deleted from portfolio {}", tickerId, portfolioId);
    }

    private HoldingDto mapToDto(PortfolioHolding entity) {
        HoldingDto dto = new HoldingDto();
        dto.setPortfolioId(entity.getId().getPortfolioId());
        dto.setTickerId(entity.getId().getTickerId());
        dto.setQuantity(entity.getQuantity());
        dto.setCashBalance(entity.getCashBalance());
        dto.setNotes(entity.getNotes());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
