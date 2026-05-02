package com.marketplace.user.domain.repository;

import com.marketplace.user.domain.model.SavedCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SavedCardRepository extends JpaRepository<SavedCard, String> {

    List<SavedCard> findAllByUserIdOrderByIsDefaultDescCreatedAtDesc(String userId);

    Optional<SavedCard> findByIdAndUserId(String id, String userId);

    @Modifying
    @Query("UPDATE SavedCard c SET c.isDefault = false WHERE c.userId = :userId")
    void clearDefaultForUser(String userId);
}
