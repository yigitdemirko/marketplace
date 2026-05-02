package com.marketplace.user.infrastructure.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.List;
import java.util.Set;

@Repository
@RequiredArgsConstructor
public class RefreshTokenRedisRepository {

    private static final String TOKEN_KEY_PREFIX = "auth:refresh:";
    private static final String USER_SET_KEY_PREFIX = "auth:refresh:user:";

    private final StringRedisTemplate redisTemplate;

    public void store(String tokenHash, String userId, Duration ttl) {
        String tokenKey = TOKEN_KEY_PREFIX + tokenHash;
        String userSetKey = USER_SET_KEY_PREFIX + userId;
        redisTemplate.opsForValue().set(tokenKey, userId, ttl);
        redisTemplate.opsForSet().add(userSetKey, tokenHash);
        // Keep the user set alive as long as there are tokens
        redisTemplate.expire(userSetKey, ttl);
    }

    public String getUserId(String tokenHash) {
        return redisTemplate.opsForValue().get(TOKEN_KEY_PREFIX + tokenHash);
    }

    public void revoke(String tokenHash) {
        String userId = getUserId(tokenHash);
        redisTemplate.delete(TOKEN_KEY_PREFIX + tokenHash);
        if (userId != null) {
            redisTemplate.opsForSet().remove(USER_SET_KEY_PREFIX + userId, tokenHash);
        }
    }

    public void revokeAllForUser(String userId) {
        String userSetKey = USER_SET_KEY_PREFIX + userId;
        Set<String> hashes = redisTemplate.opsForSet().members(userSetKey);
        if (hashes != null && !hashes.isEmpty()) {
            List<String> tokenKeys = hashes.stream()
                    .map(h -> TOKEN_KEY_PREFIX + h)
                    .toList();
            redisTemplate.delete(tokenKeys);
        }
        redisTemplate.delete(userSetKey);
    }
}
