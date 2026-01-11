package com.finstream.api.service;

import com.finstream.api.dto.PriceDailyDto;
import com.finstream.api.entity.FactPriceDaily;
import com.finstream.api.exception.ResourceNotFoundException;
import com.finstream.api.repository.FactPriceDailyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FactPriceDailyService {
    private final FactPriceDailyRepository factPriceDailyRepository;

    public Page<PriceDailyDto> getPricesByDateRange(String tickerId, LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        Page<FactPriceDaily> prices = factPriceDailyRepository
                .findByTickerAndDateRange(tickerId, fromDate, toDate, pageable);
        if (prices.isEmpty()) {
            throw new ResourceNotFoundException("No prices found for the given criteria");
        }
        List<PriceDailyDto> dtos = prices.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, prices.getTotalElements());
    }

    public PriceDailyDto getLatestPrice(String tickerId) {
        FactPriceDaily price = factPriceDailyRepository.findLatestByTicker(tickerId)
                .orElseThrow(() -> new ResourceNotFoundException("No price data found for ticker"));
        return mapToDto(price);
    }

    private PriceDailyDto mapToDto(FactPriceDaily entity) {
        PriceDailyDto dto = new PriceDailyDto();
        dto.setTickerId(entity.getId().getTickerId());
        dto.setDate(entity.getId().getDate());
        dto.setOpen(entity.getOpen());
        dto.setHigh(entity.getHigh());
        dto.setLow(entity.getLow());
        dto.setClose(entity.getClose());
        dto.setVolume(entity.getVolume());
        return dto;
    }
}
