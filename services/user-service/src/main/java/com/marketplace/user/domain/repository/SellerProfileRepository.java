package com.marketplace.user.domain.repository;

import com.marketplace.user.domain.model.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SellerProfileRepository extends JpaRepository<SellerProfile, String> {

    Optional<SellerProfile> findByUserId(String userId);
}