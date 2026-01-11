package com.finstream.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FinancialDto {
    private String tickerId;
    private LocalDate reportDate;
    private String reportType;
    private BigDecimal totalRevenue;
    private BigDecimal netIncome;
    private BigDecimal ebitda;
    private BigDecimal totalAssets;
    private BigDecimal totalLiabilities;
    private BigDecimal totalEquity;
    private BigDecimal cashAndEquivalents;
    private BigDecimal operatingCashFlow;
    private BigDecimal freeCashFlow;
}
