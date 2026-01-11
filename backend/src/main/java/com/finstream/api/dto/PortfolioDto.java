package com.finstream.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PortfolioDto {
    private UUID portfolioId;

    @NotBlank(message = "Portfolio name cannot be blank", groups = {Create.class, Update.class})
    private String portfolioName;

    @NotBlank(message = "Base currency cannot be blank", groups = {Create.class})
    private String baseCurrency;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public interface Create {}
    public interface Update {}
}
