package com.marketplace.inventory.application.service;

import com.marketplace.inventory.domain.model.ProductStock;
import com.marketplace.inventory.domain.model.StockReservation;
import com.marketplace.inventory.domain.repository.StockReservationRepository;
import com.marketplace.inventory.infrastructure.messaging.InventoryEventPublisher;
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

import com.marketplace.inventory.domain.repository.ProductStockRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockService {

    private final MongoTemplate mongoTemplate;
    private final StockReservationRepository reservationRepository;
    private final ProductStockRepository productStockRepository;
    private final InventoryEventPublisher eventPublisher;

    public ProductStock setStock(String productId, String sellerId, int newStock) {
        if (newStock < 0) {
            throw new IllegalArgumentException("Stock cannot be negative");
        }
        ProductStock existing = productStockRepository.findById(productId).orElse(null);
        if (existing == null) {
            ProductStock created = ProductStock.builder()
                    .productId(productId)
                    .sellerId(sellerId)
                    .stock(newStock)
                    .build();
            ProductStock saved = productStockRepository.save(created);
            eventPublisher.publishStockChanged(saved);
            log.info("Stock initialised via setStock: productId={} stock={}", productId, newStock);
            return saved;
        }
        existing.setStock(newStock);
        ProductStock saved = productStockRepository.save(existing);
        eventPublisher.publishStockChanged(saved);
        log.info("Stock set: productId={} stock={}", productId, newStock);
        return saved;
    }

    public Optional<String> reserve(String orderId, List<StockReservation.ReservedItem> items) {
        Optional<StockReservation> existing = reservationRepository.findById(orderId);
        if (existing.isPresent()) {
            log.info("Reservation already exists for orderId={}, status={}", orderId, existing.get().getStatus());
            return Optional.empty();
        }

        List<StockReservation.ReservedItem> decremented = new ArrayList<>();
        for (StockReservation.ReservedItem item : items) {
            ProductStock updated = decrementStock(item.getProductId(), item.getQuantity());
            if (updated == null) {
                rollback(decremented);
                log.warn("Insufficient stock: orderId={}, productId={}", orderId, item.getProductId());
                return Optional.of("Insufficient stock for productId=" + item.getProductId());
            }
            decremented.add(item);
            eventPublisher.publishStockChanged(updated);
        }

        reservationRepository.save(StockReservation.builder()
                .orderId(orderId)
                .items(items)
                .status(StockReservation.Status.RESERVED)
                .build());
        log.info("Stock reserved: orderId={}, items={}", orderId, items.size());
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
            ProductStock updated = incrementStock(item.getProductId(), item.getQuantity());
            if (updated != null) {
                eventPublisher.publishStockChanged(updated);
            }
        }
        reservation.setStatus(StockReservation.Status.RELEASED);
        reservationRepository.save(reservation);
        log.info("Stock released: orderId={}, items={}", orderId, reservation.getItems().size());
    }

    private ProductStock decrementStock(String productId, int quantity) {
        Query query = new Query(Criteria.where("_id").is(productId).and("stock").gte(quantity));
        Update update = new Update().inc("stock", -quantity);
        return mongoTemplate.findAndModify(query, update, ProductStock.class);
    }

    private ProductStock incrementStock(String productId, int quantity) {
        Query query = new Query(Criteria.where("_id").is(productId));
        Update update = new Update().inc("stock", quantity);
        return mongoTemplate.findAndModify(query, update, ProductStock.class);
    }

    private void rollback(List<StockReservation.ReservedItem> decremented) {
        for (StockReservation.ReservedItem item : decremented) {
            ProductStock reverted = incrementStock(item.getProductId(), item.getQuantity());
            if (reverted != null) {
                eventPublisher.publishStockChanged(reverted);
            }
        }
    }
}
