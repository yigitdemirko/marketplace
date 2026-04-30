package com.marketplace.feedingestion.domain.repository;

import com.marketplace.feedingestion.domain.model.ImportJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ImportJobRepository extends JpaRepository<ImportJob, UUID> {

    Page<ImportJob> findBySellerIdOrderByCreatedAtDesc(String sellerId, Pageable pageable);
}
