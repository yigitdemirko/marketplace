package com.marketplace.basket.domain.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Basket {

    private String userId;
    private Map<String, Integer> items;
    private Instant updatedAt;

    public static Basket empty(String userId) {
        return new Basket(userId, new LinkedHashMap<>(), Instant.now());
    }

    public int totalQuantity() {
        return items.values().stream().mapToInt(Integer::intValue).sum();
    }

    public int distinctItemCount() {
        return items.size();
    }
}
