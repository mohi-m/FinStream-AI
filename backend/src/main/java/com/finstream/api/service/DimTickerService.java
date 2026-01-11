package com.finstream.api.service;

import com.finstream.api.dto.TickerDto;
import com.finstream.api.entity.DimTicker;
import com.finstream.api.exception.ResourceNotFoundException;
import com.finstream.api.repository.DimTickerRepository;
import lombok.RequiredArgsConstructor;
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
public class DimTickerService {
    private final DimTickerRepository dimTickerRepository;

    public Page<TickerDto> searchTickers(String query, Pageable pageable) {
        Page<DimTicker> tickers = dimTickerRepository
                .findByTickerIdContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(query, query, pageable);
        List<TickerDto> dtos = tickers.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, tickers.getTotalElements());
    }

    public TickerDto getTicker(String tickerId) {
        DimTicker ticker = dimTickerRepository.findById(tickerId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticker not found"));
        return mapToDto(ticker);
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
