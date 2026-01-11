package com.finstream.api.service;

import com.finstream.api.dto.PortfolioDto;
import com.finstream.api.entity.UserPortfolio;
import com.finstream.api.exception.DuplicateResourceException;
import com.finstream.api.exception.ResourceNotFoundException;
import com.finstream.api.exception.UnauthorizedAccessException;
import com.finstream.api.repository.UserPortfolioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserPortfolioService {
    private final UserPortfolioRepository userPortfolioRepository;

    public Page<PortfolioDto> getUserPortfolios(String firebaseUid, Pageable pageable) {
        Page<UserPortfolio> portfolios = userPortfolioRepository.findByFirebaseUid(firebaseUid, pageable);
        List<PortfolioDto> dtos = portfolios.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, portfolios.getTotalElements());
    }

    public PortfolioDto getPortfolio(UUID portfolioId, String firebaseUid) {
        UserPortfolio portfolio = userPortfolioRepository.findByPortfolioIdAndFirebaseUid(portfolioId, firebaseUid)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found"));
        return mapToDto(portfolio);
    }

    public PortfolioDto createPortfolio(String firebaseUid, PortfolioDto dto) {
        if (userPortfolioRepository.existsByFirebaseUidAndPortfolioName(firebaseUid, dto.getPortfolioName())) {
            throw new DuplicateResourceException("Portfolio with this name already exists");
        }

        UserPortfolio portfolio = new UserPortfolio();
        portfolio.setFirebaseUid(firebaseUid);
        portfolio.setPortfolioName(dto.getPortfolioName());
        portfolio.setBaseCurrency(dto.getBaseCurrency() != null ? dto.getBaseCurrency() : "USD");

        UserPortfolio saved = userPortfolioRepository.save(portfolio);
        return mapToDto(saved);
    }

    public PortfolioDto updatePortfolio(UUID portfolioId, String firebaseUid, PortfolioDto dto) {
        UserPortfolio portfolio = userPortfolioRepository.findByPortfolioIdAndFirebaseUid(portfolioId, firebaseUid)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found"));

        // Check for duplicate portfolio name (if changed)
        if (dto.getPortfolioName() != null && !dto.getPortfolioName().equals(portfolio.getPortfolioName())) {
            if (userPortfolioRepository.existsByFirebaseUidAndPortfolioName(firebaseUid, dto.getPortfolioName())) {
                throw new DuplicateResourceException("Portfolio with this name already exists");
            }
            portfolio.setPortfolioName(dto.getPortfolioName());
        }

        if (dto.getBaseCurrency() != null) {
            portfolio.setBaseCurrency(dto.getBaseCurrency());
        }

        UserPortfolio saved = userPortfolioRepository.save(portfolio);
        return mapToDto(saved);
    }

    public void deletePortfolio(UUID portfolioId, String firebaseUid) {
        UserPortfolio portfolio = userPortfolioRepository.findByPortfolioIdAndFirebaseUid(portfolioId, firebaseUid)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found"));
        userPortfolioRepository.delete(portfolio);
    }

    private PortfolioDto mapToDto(UserPortfolio entity) {
        PortfolioDto dto = new PortfolioDto();
        dto.setPortfolioId(entity.getPortfolioId());
        dto.setPortfolioName(entity.getPortfolioName());
        dto.setBaseCurrency(entity.getBaseCurrency());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
