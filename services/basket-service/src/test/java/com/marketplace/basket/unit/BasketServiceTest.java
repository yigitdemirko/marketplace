package com.marketplace.basket.unit;

import com.marketplace.basket.application.service.BasketLimitExceededException;
import com.marketplace.basket.application.service.BasketService;
import com.marketplace.basket.domain.model.Basket;
import com.marketplace.basket.domain.repository.BasketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("unit")
class BasketServiceTest {

    private BasketRepository repo;
    private BasketService service;
    private Map<String, Integer> store;

    @BeforeEach
    void setUp() {
        repo = mock(BasketRepository.class);
        service = new BasketService(repo);
        ReflectionTestUtils.setField(service, "maxItems", 50);
        ReflectionTestUtils.setField(service, "maxQtyPerItem", 99);

        store = new LinkedHashMap<>();
        when(repo.find(anyString())).thenAnswer(inv -> new Basket(inv.getArgument(0), new LinkedHashMap<>(store), Instant.now()));

        doAnswer(inv -> { store.put(inv.getArgument(1), inv.getArgument(2)); return null; })
                .when(repo).setQuantity(anyString(), anyString(), anyInt());
        doAnswer(inv -> { store.remove(inv.getArgument(1)); return null; })
                .when(repo).removeItem(anyString(), anyString());
        doAnswer(inv -> {
            store.clear();
            store.putAll(inv.getArgument(1));
            return null;
        }).when(repo).replaceAll(anyString(), any());
        doAnswer(inv -> { store.clear(); return null; }).when(repo).clear(anyString());
    }

    @Test
    void should_AddNewItem_WhenBasketEmpty() {
        Basket result = service.addItem("u1", "p1", 3);

        assertThat(result.getItems()).containsEntry("p1", 3);
        verify(repo).setQuantity("u1", "p1", 3);
    }

    @Test
    void should_SumQuantity_WhenItemAlreadyInBasket() {
        store.put("p1", 2);
        service.addItem("u1", "p1", 3);
        verify(repo).setQuantity("u1", "p1", 5);
    }

    @Test
    void should_ClampToMaxQty_WhenAddPushesOverLimit() {
        store.put("p1", 95);
        service.addItem("u1", "p1", 50);
        verify(repo).setQuantity("u1", "p1", 99);
    }

    @Test
    void should_RejectAdd_WhenMaxItemsReached() {
        for (int i = 0; i < 50; i++) store.put("p" + i, 1);

        assertThatThrownBy(() -> service.addItem("u1", "p-new", 1))
                .isInstanceOf(BasketLimitExceededException.class);
        verify(repo, never()).setQuantity(anyString(), anyString(), anyInt());
    }

    @Test
    void should_RemoveItem_WhenSetToZero() {
        store.put("p1", 5);
        service.setItem("u1", "p1", 0);
        verify(repo).removeItem("u1", "p1");
    }

    @Test
    void should_RejectNegativeQuantity() {
        assertThatThrownBy(() -> service.setItem("u1", "p1", -1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void should_MergeWithMaxStrategy_WhenIncomingHasOverlap() {
        store.put("p1", 2);
        store.put("p2", 5);

        service.merge("u1", List.of(
                new BasketService.MergeItem("p1", 4),  // existing 2, incoming 4 → max=4
                new BasketService.MergeItem("p2", 3),  // existing 5, incoming 3 → max=5
                new BasketService.MergeItem("p3", 7)   // new
        ));

        assertThat(store).containsEntry("p1", 4);
        assertThat(store).containsEntry("p2", 5);
        assertThat(store).containsEntry("p3", 7);
    }

    @Test
    void should_TrimMergeResult_WhenExceedingMaxItems() {
        for (int i = 0; i < 49; i++) store.put("p" + i, 1);

        List<BasketService.MergeItem> incoming = new java.util.ArrayList<>();
        for (int i = 100; i < 110; i++) incoming.add(new BasketService.MergeItem("p" + i, 1));

        service.merge("u1", incoming);

        Map<String, Integer> persisted = captureReplaceAll();
        assertThat(persisted).hasSize(50);
    }

    @Test
    void should_RemoveOrderedItems_WhenOrderCreated() {
        store.put("p1", 1);
        store.put("p2", 2);
        store.put("p3", 3);

        service.removeOrderedItems("u1", List.of("p1", "p3"));

        verify(repo).removeItem("u1", "p1");
        verify(repo).removeItem("u1", "p3");
        verify(repo, times(2)).removeItem(anyString(), anyString());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Integer> captureReplaceAll() {
        org.mockito.ArgumentCaptor<Map<String, Integer>> captor = org.mockito.ArgumentCaptor.forClass(Map.class);
        verify(repo).replaceAll(anyString(), captor.capture());
        return captor.getValue();
    }
}
