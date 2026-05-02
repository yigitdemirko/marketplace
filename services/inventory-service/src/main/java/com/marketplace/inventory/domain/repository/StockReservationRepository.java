package com.marketplace.inventory.domain.repository;

import com.marketplace.inventory.domain.model.StockReservation;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StockReservationRepository extends MongoRepository<StockReservation, String> {
}
