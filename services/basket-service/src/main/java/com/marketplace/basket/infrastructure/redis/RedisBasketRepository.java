package com.marketplace.basket.infrastructure.redis;

import com.marketplace.basket.domain.model.Basket;
import com.marketplace.basket.domain.repository.BasketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class RedisBasketRepository implements BasketRepository {

    private static final String KEY_PREFIX = "basket:user:";

    private final StringRedisTemplate redis;

    @Value("${app.basket.ttl-days:30}")
    private long ttlDays;

    @Override
    public Basket find(String userId) {
        Map<Object, Object> raw = ops().entries(key(userId));
        Map<String, Integer> items = new LinkedHashMap<>();
        if (raw != null) {
            raw.forEach((k, v) -> items.put(k.toString(), Integer.parseInt(v.toString())));
        }
        return new Basket(userId, items, Instant.now());
    }

    @Override
    public void setQuantity(String userId, String productId, int quantity) {
        if (quantity <= 0) {
            removeItem(userId, productId);
            return;
        }
        ops().put(key(userId), productId, String.valueOf(quantity));
        touchTtl(userId);
    }

    @Override
    public void incrementQuantity(String userId, String productId, int delta) {
        ops().increment(key(userId), productId, delta);
        touchTtl(userId);
    }

    @Override
    public void removeItem(String userId, String productId) {
        ops().delete(key(userId), productId);
    }

    @Override
    public void replaceAll(String userId, Map<String, Integer> items) {
        String key = key(userId);
        redis.delete(key);
        if (items.isEmpty()) {
            return;
        }
        Map<String, String> stringified = new LinkedHashMap<>();
        items.forEach((pid, qty) -> stringified.put(pid, String.valueOf(qty)));
        ops().putAll(key, stringified);
        touchTtl(userId);
    }

    @Override
    public void clear(String userId) {
        redis.delete(key(userId));
    }

    private void touchTtl(String userId) {
        redis.expire(key(userId), Duration.ofDays(ttlDays));
    }

    private HashOperations<String, Object, Object> ops() {
        return redis.opsForHash();
    }

    private String key(String userId) {
        return KEY_PREFIX + userId;
    }
}
