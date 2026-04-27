package com.marketplace.user.domain.repository;

import com.marketplace.user.domain.model.BuyerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BuyerProfileRepository extends JpaRepository<BuyerProfile, String> {

    Optional<BuyerProfile> findByUserId(String userId);
}