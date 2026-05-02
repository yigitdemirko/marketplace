package com.marketplace.basket.unit;

import com.marketplace.basket.application.service.BasketService;
import com.marketplace.basket.infrastructure.messaging.OrderEventConsumer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@Tag("unit")
class OrderEventConsumerTest {

    private BasketService basketService;
    private OrderEventConsumer consumer;

    @BeforeEach
    void setUp() {
        basketService = mock(BasketService.class);
        consumer = new OrderEventConsumer(basketService);
    }

    @Test
    void should_RemoveOrderedItemsFromBuyerBasket() {
        Map<String, Object> event = Map.of(
                "orderId", "order-1",
                "userId", "user-1",
                "items", List.of(
                        Map.of("productId", "p1", "quantity", 2),
                        Map.of("productId", "p2", "quantity", 1)
                )
        );

        consumer.handleOrderCreated(event);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<String>> ids = ArgumentCaptor.forClass(List.class);
        verify(basketService).removeOrderedItems(eq("user-1"), ids.capture());
        assertThat(ids.getValue()).containsExactly("p1", "p2");
    }

    @Test
    void should_SkipWhenUserIdMissing() {
        Map<String, Object> event = Map.of(
                "orderId", "order-1",
                "items", List.of(Map.of("productId", "p1", "quantity", 1))
        );

        consumer.handleOrderCreated(event);

        verify(basketService, never()).removeOrderedItems(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void should_SkipWhenItemsMissing() {
        Map<String, Object> event = Map.of("orderId", "order-1", "userId", "user-1");

        consumer.handleOrderCreated(event);

        verify(basketService, never()).removeOrderedItems(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void should_SwallowExceptionsFromBasketService() {
        Map<String, Object> event = Map.of(
                "orderId", "order-1",
                "userId", "user-1",
                "items", List.of(Map.of("productId", "p1", "quantity", 1))
        );
        org.mockito.Mockito.doThrow(new RuntimeException("redis down"))
                .when(basketService).removeOrderedItems(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyList());

        consumer.handleOrderCreated(event);
        // no exception escapes
    }

    private static <T> T eq(T value) {
        return org.mockito.ArgumentMatchers.eq(value);
    }
}
