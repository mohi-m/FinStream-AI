package com.finstream.api.repository;

import com.finstream.api.entity.PortfolioHolding;
import com.finstream.api.entity.PortfolioHolding.PortfolioHoldingId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PortfolioHoldingRepository extends JpaRepository<PortfolioHolding, PortfolioHoldingId> {
    @Query("SELECT ph FROM PortfolioHolding ph WHERE ph.id.portfolioId = :portfolioId")
    Page<PortfolioHolding> findByPortfolioId(@Param("portfolioId") UUID portfolioId, Pageable pageable);

    @Query("SELECT ph FROM PortfolioHolding ph WHERE ph.id.portfolioId = :portfolioId")
    List<PortfolioHolding> findAllByPortfolioId(@Param("portfolioId") UUID portfolioId);
}
