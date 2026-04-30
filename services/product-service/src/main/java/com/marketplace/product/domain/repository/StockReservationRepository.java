package com.marketplace.product.domain.repository;

import com.marketplace.product.domain.model.StockReservation;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StockReservationRepository extends MongoRepository<StockReservation, String> {
}
