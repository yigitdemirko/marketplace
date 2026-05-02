package com.marketplace.basket.domain.repository;

import com.marketplace.basket.domain.model.Basket;

import java.util.Map;

public interface BasketRepository {

    Basket find(String userId);

    void setQuantity(String userId, String productId, int quantity);

    void incrementQuantity(String userId, String productId, int delta);

    void removeItem(String userId, String productId);

    void replaceAll(String userId, Map<String, Integer> items);

    void clear(String userId);
}
