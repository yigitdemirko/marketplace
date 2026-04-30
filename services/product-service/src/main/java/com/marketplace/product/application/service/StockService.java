package com.marketplace.product.application.service;

import com.marketplace.product.domain.model.Product;
import com.marketplace.product.domain.model.StockReservation;
import com.marketplace.product.domain.repository.StockReservationRepository;
import com.marketplace.product.infrastructure.messaging.ProductEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockService {

    private final MongoTemplate mongoTemplate;
    private final StockReservationRepository reservationRepository;
    private final ProductEventPublisher productEventPublisher;

    public Optional<String> reserve(String orderId, List<StockReservation.ReservedItem> items) {
        Optional<StockReservation> existing = reservationRepository.findById(orderId);
        if (existing.isPresent()) {
            log.info("Reservation already exists for orderId={}, status={}", orderId, existing.get().getStatus());
            return Optional.empty();
        }

        List<StockReservation.ReservedItem> decremented = new ArrayList<>();
        for (StockReservation.ReservedItem item : items) {
            Product updated = decrementStock(item.getProductId(), item.getQuantity());
            if (updated == null) {
                rollback(decremented);
                return Optional.of("Insufficient stock for productId=" + item.getProductId());
            }
            decremented.add(item);
            productEventPublisher.publishProductUpdated(updated);
        }

        reservationRepository.save(StockReservation.builder()
                .orderId(orderId)
                .items(items)
                .status(StockReservation.Status.RESERVED)
                .build());
        return Optional.empty();
    }

    public void release(String orderId) {
        Optional<StockReservation> reservationOpt = reservationRepository.findById(orderId);
        if (reservationOpt.isEmpty()) {
            log.info("No reservation to release for orderId={}", orderId);
            return;
        }
        StockReservation reservation = reservationOpt.get();
        if (reservation.getStatus() == StockReservation.Status.RELEASED) {
            log.info("Reservation already released for orderId={}", orderId);
            return;
        }

        for (StockReservation.ReservedItem item : reservation.getItems()) {
            Product updated = incrementStock(item.getProductId(), item.getQuantity());
            if (updated != null) {
                productEventPublisher.publishProductUpdated(updated);
            }
        }
        reservation.setStatus(StockReservation.Status.RELEASED);
        reservationRepository.save(reservation);
    }

    private Product decrementStock(String productId, int quantity) {
        Query query = new Query(Criteria.where("_id").is(productId).and("stock").gte(quantity));
        Update update = new Update().inc("stock", -quantity);
        return mongoTemplate.findAndModify(query, update, Product.class);
    }

    private Product incrementStock(String productId, int quantity) {
        Query query = new Query(Criteria.where("_id").is(productId));
        Update update = new Update().inc("stock", quantity);
        return mongoTemplate.findAndModify(query, update, Product.class);
    }

    private void rollback(List<StockReservation.ReservedItem> decremented) {
        for (StockReservation.ReservedItem item : decremented) {
            Product reverted = incrementStock(item.getProductId(), item.getQuantity());
            if (reverted != null) {
                productEventPublisher.publishProductUpdated(reverted);
            }
        }
    }
}
