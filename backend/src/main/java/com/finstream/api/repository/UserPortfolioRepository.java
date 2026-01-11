package com.finstream.api.repository;

import com.finstream.api.entity.UserPortfolio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPortfolioRepository extends JpaRepository<UserPortfolio, UUID> {
    Page<UserPortfolio> findByFirebaseUid(String firebaseUid, Pageable pageable);

    Optional<UserPortfolio> findByPortfolioIdAndFirebaseUid(UUID portfolioId, String firebaseUid);

    boolean existsByFirebaseUidAndPortfolioName(String firebaseUid, String portfolioName);
}
