package com.marketplace.user.domain.repository;

import com.marketplace.user.domain.model.SavedAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SavedAddressRepository extends JpaRepository<SavedAddress, String> {

    List<SavedAddress> findAllByUserIdOrderByIsDefaultDescCreatedAtDesc(String userId);

    Optional<SavedAddress> findByIdAndUserId(String id, String userId);

    @Modifying
    @Query("UPDATE SavedAddress a SET a.isDefault = false WHERE a.userId = :userId")
    void clearDefaultForUser(String userId);
}
