package com.finstream.api.repository;

import com.finstream.api.entity.DimTicker;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DimTickerRepository extends JpaRepository<DimTicker, String> {
    Page<DimTicker> findByTickerIdContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(
            String tickerId, String companyName, Pageable pageable);
}
