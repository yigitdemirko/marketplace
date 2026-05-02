package com.marketplace.basket.integration;

import com.marketplace.basket.domain.model.Basket;
import com.marketplace.basket.domain.repository.BasketRepository;
import com.marketplace.basket.infrastructure.client.CatalogClient;
import com.redis.testcontainers.RedisContainer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("integration")
@SpringBootTest(properties = {
        "spring.cloud.config.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "eureka.client.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.cloud.openfeign.FeignAutoConfiguration"
})
@Testcontainers
@ActiveProfiles("test")
class RedisBasketRepositoryTest {

    @Container
    @ServiceConnection(name = "redis")
    static RedisContainer redis = new RedisContainer("redis:7-alpine");

    @Autowired
    private BasketRepository repository;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @MockitoBean
    private CatalogClient catalogClient;

    @BeforeEach
    void cleanState() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();
    }

    @Test
    void should_RoundTripBasketItems() {
        repository.setQuantity("user-1", "p1", 3);
        repository.setQuantity("user-1", "p2", 5);

        Basket basket = repository.find("user-1");

        assertThat(basket.getItems()).containsEntry("p1", 3).containsEntry("p2", 5);
    }

    @Test
    void should_ReturnEmptyBasket_WhenUserUnknown() {
        Basket basket = repository.find("ghost");
        assertThat(basket.getItems()).isEmpty();
    }

    @Test
    void should_RemoveItem() {
        repository.setQuantity("user-1", "p1", 3);
        repository.removeItem("user-1", "p1");

        assertThat(repository.find("user-1").getItems()).doesNotContainKey("p1");
    }

    @Test
    void should_OverwriteAll_OnReplaceAll() {
        repository.setQuantity("user-1", "p-old", 9);

        Map<String, Integer> next = new LinkedHashMap<>();
        next.put("p1", 1);
        next.put("p2", 2);
        repository.replaceAll("user-1", next);

        Basket basket = repository.find("user-1");
        assertThat(basket.getItems()).containsOnlyKeys("p1", "p2");
    }

    @Test
    void should_ClearAllItems() {
        repository.setQuantity("user-1", "p1", 1);
        repository.clear("user-1");

        assertThat(repository.find("user-1").getItems()).isEmpty();
    }

    @Test
    void should_RemoveItem_WhenSetQuantityToZero() {
        repository.setQuantity("user-1", "p1", 5);
        repository.setQuantity("user-1", "p1", 0);

        assertThat(repository.find("user-1").getItems()).doesNotContainKey("p1");
    }

    @Test
    void should_IsolateBasketsAcrossUsers() {
        repository.setQuantity("user-A", "p1", 1);
        repository.setQuantity("user-B", "p1", 2);

        assertThat(repository.find("user-A").getItems()).containsEntry("p1", 1);
        assertThat(repository.find("user-B").getItems()).containsEntry("p1", 2);
    }
}
