package com.marketplace.catalog.unit;

import com.marketplace.catalog.domain.model.Product;
import com.marketplace.catalog.domain.repository.ProductRepository;
import com.marketplace.catalog.infrastructure.messaging.ProductEventPublisher;
import com.marketplace.catalog.infrastructure.messaging.StockChangedConsumer;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class StockChangedConsumerTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductEventPublisher productEventPublisher;

    @InjectMocks
    private StockChangedConsumer consumer;

    private Map<String, Object> event(String productId, Object stock) {
        Map<String, Object> e = new HashMap<>();
        e.put("productId", productId);
        e.put("stock", stock);
        return e;
    }

    private Product productWithStock(String id, int stock) {
        return Product.builder()
                .id(id)
                .sellerId("s1")
                .stock(stock)
                .active(true)
                .build();
    }

    @Test
    void should_UpdateCachedStock_AndRepublish_When_StockChanged() {
        Product existing = productWithStock("p1", 10);
        when(productRepository.findById("p1")).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));

        consumer.handleStockChanged(event("p1", 7));

        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(captor.capture());
        assertThat(captor.getValue().getStock()).isEqualTo(7);
        verify(productEventPublisher).publishProductUpdated(captor.getValue());
    }

    @Test
    void should_NoOp_When_NewStockEqualsCachedStock() {
        Product existing = productWithStock("p1", 10);
        when(productRepository.findById("p1")).thenReturn(Optional.of(existing));

        consumer.handleStockChanged(event("p1", 10));

        verify(productRepository, never()).save(any());
        verifyNoInteractions(productEventPublisher);
    }

    @Test
    void should_LogAndSkip_When_ProductUnknown() {
        when(productRepository.findById(anyString())).thenReturn(Optional.empty());

        consumer.handleStockChanged(event("ghost", 5));

        verify(productRepository, never()).save(any());
        verifyNoInteractions(productEventPublisher);
    }

    @Test
    void should_Skip_When_PayloadMissingProductId() {
        consumer.handleStockChanged(event(null, 5));

        verifyNoInteractions(productRepository, productEventPublisher);
    }

    @Test
    void should_Skip_When_PayloadMissingStock() {
        consumer.handleStockChanged(event("p1", null));

        verifyNoInteractions(productRepository, productEventPublisher);
    }

    @Test
    void should_AcceptIntegerOrLongStock_FromKafkaJson() {
        Product existing = productWithStock("p1", 10);
        when(productRepository.findById("p1")).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));

        consumer.handleStockChanged(event("p1", 5L));

        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(captor.capture());
        assertThat(captor.getValue().getStock()).isEqualTo(5);
    }
}
