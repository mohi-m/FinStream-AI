package com.finstream.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HoldingDto {
    private UUID portfolioId;

    @NotBlank(message = "Ticker ID cannot be blank", groups = {Create.class, Update.class})
    private String tickerId;

    @NotNull(message = "Quantity cannot be null", groups = {Create.class, Update.class})
    @DecimalMin(value = "0", inclusive = true, message = "Quantity must be >= 0", groups = {Create.class, Update.class})
    private BigDecimal quantity;

    @DecimalMin(value = "0", inclusive = true, message = "Cash balance must be >= 0", groups = {Create.class, Update.class})
    private BigDecimal cashBalance;

    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public interface Create {}
    public interface Update {}
}
