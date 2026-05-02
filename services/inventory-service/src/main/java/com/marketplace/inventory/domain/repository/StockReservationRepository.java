package com.marketplace.inventory.domain.repository;

import com.marketplace.inventory.domain.model.StockReservation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface StockReservationRepository extends MongoRepository<StockReservation, String> {

    List<StockReservation> findAllByStatusAndExpiresAtBefore(StockReservation.Status status, LocalDateTime cutoff);
}
