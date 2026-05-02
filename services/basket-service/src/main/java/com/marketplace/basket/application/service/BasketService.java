package com.marketplace.basket.application.service;

import com.marketplace.basket.domain.model.Basket;
import com.marketplace.basket.domain.repository.BasketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class BasketService {

    private final BasketRepository repository;

    @Value("${app.basket.max-items:50}")
    private int maxItems;

    @Value("${app.basket.max-quantity-per-item:99}")
    private int maxQtyPerItem;

    public Basket get(String userId) {
        return repository.find(userId);
    }

    public Basket addItem(String userId, String productId, int quantity) {
        validateQuantity(quantity);
        Basket current = repository.find(userId);
        int newQty = clampQty(current.getItems().getOrDefault(productId, 0) + quantity);
        if (!current.getItems().containsKey(productId) && current.distinctItemCount() >= maxItems) {
            throw new BasketLimitExceededException("Basket cannot exceed " + maxItems + " distinct items");
        }
        repository.setQuantity(userId, productId, newQty);
        log.info("Basket add: userId={}, productId={}, quantity={}", userId, productId, newQty);
        return repository.find(userId);
    }

    public Basket setItem(String userId, String productId, int quantity) {
        if (quantity < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }
        if (quantity == 0) {
            repository.removeItem(userId, productId);
            return repository.find(userId);
        }
        int clamped = clampQty(quantity);
        Basket current = repository.find(userId);
        if (!current.getItems().containsKey(productId) && current.distinctItemCount() >= maxItems) {
            throw new BasketLimitExceededException("Basket cannot exceed " + maxItems + " distinct items");
        }
        repository.setQuantity(userId, productId, clamped);
        log.info("Basket set: userId={}, productId={}, quantity={}", userId, productId, clamped);
        return repository.find(userId);
    }

    public Basket removeItem(String userId, String productId) {
        repository.removeItem(userId, productId);
        log.info("Basket remove: userId={}, productId={}", userId, productId);
        return repository.find(userId);
    }

    public void clear(String userId) {
        repository.clear(userId);
        log.info("Basket cleared: userId={}", userId);
    }

    public Basket merge(String userId, List<MergeItem> incoming) {
        Basket current = repository.find(userId);
        Map<String, Integer> merged = new LinkedHashMap<>(current.getItems());

        for (MergeItem item : incoming) {
            if (item.quantity() <= 0) continue;
            int incomingQty = clampQty(item.quantity());
            int existingQty = merged.getOrDefault(item.productId(), 0);
            merged.put(item.productId(), Math.max(existingQty, incomingQty));
        }

        if (merged.size() > maxItems) {
            merged = trim(merged, maxItems);
        }

        repository.replaceAll(userId, merged);
        log.info("Basket merged: userId={}, distinctItems={}", userId, merged.size());
        return repository.find(userId);
    }

    public Basket removeOrderedItems(String userId, List<String> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return repository.find(userId);
        }
        for (String productId : productIds) {
            repository.removeItem(userId, productId);
        }
        log.info("Basket items removed after order: userId={}, count={}", userId, productIds.size());
        return repository.find(userId);
    }

    private void validateQuantity(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
    }

    private int clampQty(int quantity) {
        return Math.min(quantity, maxQtyPerItem);
    }

    private Map<String, Integer> trim(Map<String, Integer> map, int limit) {
        Map<String, Integer> trimmed = new LinkedHashMap<>();
        int n = 0;
        for (Map.Entry<String, Integer> e : map.entrySet()) {
            if (n++ >= limit) break;
            trimmed.put(e.getKey(), e.getValue());
        }
        return trimmed;
    }

    public record MergeItem(String productId, int quantity) {}
}
