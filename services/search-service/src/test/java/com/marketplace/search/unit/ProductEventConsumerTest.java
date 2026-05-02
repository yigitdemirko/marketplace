package com.marketplace.search.unit;

import com.marketplace.search.application.service.SearchService;
import com.marketplace.search.domain.model.ProductDocument;
import com.marketplace.search.infrastructure.messaging.ProductEventConsumer;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class ProductEventConsumerTest {

    @Mock
    private SearchService searchService;

    @InjectMocks
    private ProductEventConsumer consumer;

    @Test
    void should_MapAllFieldsAndIndex_When_ProductUpdatedEventArrives() {
        Map<String, Object> event = new java.util.HashMap<>();
        event.put("id", "p1");
        event.put("sellerId", "s1");
        event.put("name", "Test Product");
        event.put("description", "desc");
        event.put("price", "199.99");
        event.put("stock", 12);
        event.put("categoryId", "cat-1");
        event.put("brand", "Acme");
        event.put("images", List.of("img.jpg"));
        event.put("attributes", Map.of("color", "red"));
        event.put("active", true);

        consumer.handleProductUpdated(event);

        ArgumentCaptor<ProductDocument> doc = ArgumentCaptor.forClass(ProductDocument.class);
        verify(searchService).indexProduct(doc.capture());

        ProductDocument captured = doc.getValue();
        assertThat(captured.getId()).isEqualTo("p1");
        assertThat(captured.getSellerId()).isEqualTo("s1");
        assertThat(captured.getName()).isEqualTo("Test Product");
        assertThat(captured.getPrice()).isEqualByComparingTo("199.99");
        assertThat(captured.getStock()).isEqualTo(12);
        assertThat(captured.getCategoryId()).isEqualTo("cat-1");
        assertThat(captured.getBrand()).isEqualTo("Acme");
        assertThat(captured.getImages()).containsExactly("img.jpg");
        assertThat(captured.isActive()).isTrue();
    }

    @Test
    void should_HandleNullablePriceAndStock() {
        Map<String, Object> event = new java.util.HashMap<>();
        event.put("id", "p2");
        event.put("name", "Sparse");
        event.put("active", false);

        consumer.handleProductUpdated(event);

        ArgumentCaptor<ProductDocument> doc = ArgumentCaptor.forClass(ProductDocument.class);
        verify(searchService).indexProduct(doc.capture());
        assertThat(doc.getValue().getPrice()).isNull();
        assertThat(doc.getValue().getStock()).isNull();
        assertThat(doc.getValue().isActive()).isFalse();
    }
}
