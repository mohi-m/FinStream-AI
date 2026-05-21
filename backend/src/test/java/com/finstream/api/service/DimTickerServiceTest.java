package com.finstream.api.service;

import com.finstream.api.dto.TickerDto;
import com.finstream.api.entity.DimTicker;
import com.finstream.api.exception.ResourceNotFoundException;
import com.finstream.api.repository.DimTickerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DimTickerServiceTest {

    @Mock
    private DimTickerRepository dimTickerRepository;

    @InjectMocks
    private DimTickerService dimTickerService;

    private DimTicker mockTicker;

    @BeforeEach
    void setUp() {
        mockTicker = new DimTicker();
        mockTicker.setTickerId("AAPL");
        mockTicker.setCompanyName("Apple Inc.");
        mockTicker.setSector("Technology");
        mockTicker.setIndustry("Consumer Electronics");
        mockTicker.setCurrency("USD");
        mockTicker.setLastUpdated(LocalDateTime.now());
    }

    @Test
    void searchTickers_shouldReturnPageOfTickerDto() {
        String query = "AAPL";
        Pageable pageable = PageRequest.of(0, 10);
        Page<DimTicker> tickerPage = new PageImpl<>(List.of(mockTicker), pageable, 1);

        when(dimTickerRepository.findByTickerIdContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(query, query, pageable))
                .thenReturn(tickerPage);

        Page<TickerDto> result = dimTickerService.searchTickers(query, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().getFirst().getTickerId()).isEqualTo("AAPL");
        assertThat(result.getContent().getFirst().getCompanyName()).isEqualTo("Apple Inc.");
        verify(dimTickerRepository).findByTickerIdContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(query, query, pageable);
    }

    @Test
    void getTicker_whenTickerExists_shouldReturnTickerDto() {
        when(dimTickerRepository.findById("AAPL")).thenReturn(Optional.of(mockTicker));

        TickerDto result = dimTickerService.getTicker("AAPL");

        assertThat(result).isNotNull();
        assertThat(result.getTickerId()).isEqualTo("AAPL");
        verify(dimTickerRepository).findById("AAPL");
    }

    @Test
    void getTicker_whenTickerDoesNotExist_shouldThrowResourceNotFoundException() {
        when(dimTickerRepository.findById("UNKNOWN")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> dimTickerService.getTicker("UNKNOWN"));
        verify(dimTickerRepository).findById("UNKNOWN");
    }

    @Test
    void getSectors_shouldReturnListOfSectors() {
        List<String> sectors = Arrays.asList("Technology", "Healthcare");
        when(dimTickerRepository.findDistinctSectors()).thenReturn(sectors);

        List<String> result = dimTickerService.getSectors();

        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);
        assertThat(result).containsExactly("Technology", "Healthcare");
        verify(dimTickerRepository).findDistinctSectors();
    }

    @Test
    void getTopTickersByWeeklyGain_shouldReturnListOfTickerDto() {
        DimTickerRepository.TopTickerByWeeklyGainProjection projectionMock = mock(DimTickerRepository.TopTickerByWeeklyGainProjection.class);
        when(projectionMock.getTickerId()).thenReturn("AAPL");
        when(projectionMock.getCompanyName()).thenReturn("Apple Inc.");
        when(projectionMock.getSector()).thenReturn("Technology");
        when(projectionMock.getIndustry()).thenReturn("Consumer Electronics");
        when(projectionMock.getCurrency()).thenReturn("USD");
        when(projectionMock.getLastUpdated()).thenReturn(LocalDateTime.now());
        when(projectionMock.getWeeklyPercentChange()).thenReturn(5.5);

        when(dimTickerRepository.findTopTickersByWeeklyGain("Technology", 5))
                .thenReturn(List.of(projectionMock));

        List<TickerDto> result = dimTickerService.getTopTickersByWeeklyGain(5, "Technology");

        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTickerId()).isEqualTo("AAPL");
        assertThat(result.get(0).getWeeklyPercentChange()).isEqualTo(5.5);
        verify(dimTickerRepository).findTopTickersByWeeklyGain("Technology", 5);
    }
}
