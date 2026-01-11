package com.finstream.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TickerDto {
    private String tickerId;
    private String companyName;
    private String sector;
    private String industry;
    private String currency;
    private LocalDateTime lastUpdated;
}
