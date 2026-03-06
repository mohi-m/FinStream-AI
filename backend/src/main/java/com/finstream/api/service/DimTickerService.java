package com.finstream.api.service;

import com.finstream.api.dto.TickerDto;
import com.finstream.api.entity.DimTicker;
import com.finstream.api.exception.ResourceNotFoundException;
import com.finstream.api.repository.DimTickerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class DimTickerService {
    private final DimTickerRepository dimTickerRepository;

    public Page<TickerDto> searchTickers(String query, Pageable pageable) {
        log.debug("Searching tickers with query: '{}' and pageable: {}", query, pageable);
        Page<DimTicker> tickers = dimTickerRepository
                .findByTickerIdContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(query, query, pageable);
        List<TickerDto> dtos = tickers.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        log.debug("Found {} tickers", dtos.size());
        return new PageImpl<>(dtos, pageable, tickers.getTotalElements());
    }

    public TickerDto getTicker(String tickerId) {
        log.debug("Fetching ticker details for tickerId: {}", tickerId);
        DimTicker ticker = dimTickerRepository.findById(tickerId)
                .orElseThrow(() -> {
                    log.warn("Ticker not found: {}", tickerId);
                    return new ResourceNotFoundException("Ticker not found");
                });
        return mapToDto(ticker);
    }

    public List<String> getSectors() {
        log.debug("Fetching distinct sectors");
        return dimTickerRepository.findDistinctSectors();
    }

    public List<TickerDto> getTopTickersByVolume(Integer limit, String sector) {
        int effectiveLimit = limit == null ? 5 : Math.max(1, Math.min(limit, 50));
        String effectiveSector = sector != null && !sector.isBlank() ? sector.trim() : null;

        log.debug("Fetching top tickers by latest volume (limit={}, sector={})", effectiveLimit, effectiveSector);
        List<DimTicker> tickers = dimTickerRepository.findTopTickersByLatestVolume(effectiveSector, effectiveLimit);
        return tickers.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private TickerDto mapToDto(DimTicker entity) {
        TickerDto dto = new TickerDto();
        dto.setTickerId(entity.getTickerId());
        dto.setCompanyName(entity.getCompanyName());
        dto.setSector(entity.getSector());
        dto.setIndustry(entity.getIndustry());
        dto.setCurrency(entity.getCurrency());
        dto.setLastUpdated(entity.getLastUpdated());
        return dto;
    }
}
