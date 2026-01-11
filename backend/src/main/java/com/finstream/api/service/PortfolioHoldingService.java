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
public class PortfolioHoldingService {
    private final PortfolioHoldingRepository holdingRepository;
    private final UserPortfolioRepository portfolioRepository;

    public Page<HoldingDto> getHoldings(UUID portfolioId, String firebaseUid, Pageable pageable) {
        // Verify portfolio ownership
        portfolioRepository.findByPortfolioIdAndFirebaseUid(portfolioId, firebaseUid)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found"));

        Page<PortfolioHolding> holdings = holdingRepository.findByPortfolioId(portfolioId, pageable);
        List<HoldingDto> dtos = holdings.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, holdings.getTotalElements());
    }

    public HoldingDto addHolding(UUID portfolioId, String firebaseUid, HoldingDto dto) {
        // Verify portfolio ownership
        portfolioRepository.findByPortfolioIdAndFirebaseUid(portfolioId, firebaseUid)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found"));

        PortfolioHoldingId id = new PortfolioHoldingId(portfolioId, dto.getTickerId());
        if (holdingRepository.existsById(id)) {
            throw new DuplicateResourceException("Holding already exists for this ticker in this portfolio");
        }

        PortfolioHolding holding = new PortfolioHolding();
        holding.setId(id);
        holding.setQuantity(dto.getQuantity());
        holding.setCashBalance(dto.getCashBalance() != null ? dto.getCashBalance() : BigDecimal.ZERO);
        holding.setNotes(dto.getNotes());

        PortfolioHolding saved = holdingRepository.save(holding);
        return mapToDto(saved);
    }

    public HoldingDto updateHolding(UUID portfolioId, String firebaseUid, String tickerId, HoldingDto dto) {
        // Verify portfolio ownership
        portfolioRepository.findByPortfolioIdAndFirebaseUid(portfolioId, firebaseUid)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found"));

        PortfolioHoldingId id = new PortfolioHoldingId(portfolioId, tickerId);
        PortfolioHolding holding = holdingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holding not found"));

        holding.setQuantity(dto.getQuantity());
        if (dto.getCashBalance() != null) {
            holding.setCashBalance(dto.getCashBalance());
        }
        if (dto.getNotes() != null) {
            holding.setNotes(dto.getNotes());
        }

        PortfolioHolding saved = holdingRepository.save(holding);
        return mapToDto(saved);
    }

    public void deleteHolding(UUID portfolioId, String firebaseUid, String tickerId) {
        // Verify portfolio ownership
        portfolioRepository.findByPortfolioIdAndFirebaseUid(portfolioId, firebaseUid)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found"));

        PortfolioHoldingId id = new PortfolioHoldingId(portfolioId, tickerId);
        PortfolioHolding holding = holdingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holding not found"));
        holdingRepository.delete(holding);
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
