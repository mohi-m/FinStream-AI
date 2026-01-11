package com.finstream.api.service;

import com.finstream.api.dto.FinancialDto;
import com.finstream.api.entity.FactFinancial;
import com.finstream.api.exception.ResourceNotFoundException;
import com.finstream.api.repository.FactFinancialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FactFinancialService {
    private final FactFinancialRepository factFinancialRepository;

    public Page<FinancialDto> getFinancialsByDateRange(String tickerId, String reportType, LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        Page<FactFinancial> financials = factFinancialRepository
                .findByTickerAndTypeAndDateRange(tickerId, reportType, fromDate, toDate, pageable);
        if (financials.isEmpty()) {
            throw new ResourceNotFoundException("No financials found for the given criteria");
        }
        List<FinancialDto> dtos = financials.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, financials.getTotalElements());
    }

    public FinancialDto getLatestFinancial(String tickerId, String reportType) {
        FactFinancial financial = factFinancialRepository.findLatestByTickerAndType(tickerId, reportType)
                .orElseThrow(() -> new ResourceNotFoundException("No financial data found for ticker and report type"));
        return mapToDto(financial);
    }

    private FinancialDto mapToDto(FactFinancial entity) {
        FinancialDto dto = new FinancialDto();
        dto.setTickerId(entity.getId().getTickerId());
        dto.setReportDate(entity.getId().getReportDate());
        dto.setReportType(entity.getId().getReportType());
        dto.setTotalRevenue(entity.getTotalRevenue());
        dto.setNetIncome(entity.getNetIncome());
        dto.setEbitda(entity.getEbitda());
        dto.setTotalAssets(entity.getTotalAssets());
        dto.setTotalLiabilities(entity.getTotalLiabilities());
        dto.setTotalEquity(entity.getTotalEquity());
        dto.setCashAndEquivalents(entity.getCashAndEquivalents());
        dto.setOperatingCashFlow(entity.getOperatingCashFlow());
        dto.setFreeCashFlow(entity.getFreeCashFlow());
        return dto;
    }
}
