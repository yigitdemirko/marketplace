package com.marketplace.catalog.unit;

import com.marketplace.catalog.domain.model.Product;
import com.marketplace.catalog.infrastructure.messaging.ProductEventPublisher;
import com.marketplace.common.events.ProductCreatedEvent;
import com.marketplace.common.events.ProductDeletedEvent;
import com.marketplace.common.events.ProductUpdatedEvent;
import com.marketplace.common.messaging.KafkaTopics;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class ProductEventPublisherTest {

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private ProductEventPublisher publisher;

    private Product sampleProduct() {
        return Product.builder()
                .id("p1")
                .sellerId("s1")
                .name("Test")
                .description("desc")
                .price(new BigDecimal("199.99"))
                .stock(15)
                .categoryId("cat-1")
                .brand("Acme")
                .images(List.of("img.jpg"))
                .attributes(Map.of("color", "red"))
                .active(true)
                .build();
    }

    @Test
    void should_PublishProductUpdated_WithFullPayload_ToCorrectTopic() {
        publisher.publishProductUpdated(sampleProduct());

        ArgumentCaptor<ProductUpdatedEvent> captor = ArgumentCaptor.forClass(ProductUpdatedEvent.class);
        verify(kafkaTemplate).send(eq(KafkaTopics.PRODUCT_UPDATED), eq("p1"), captor.capture());

        ProductUpdatedEvent event = captor.getValue();
        assertThat(event.id()).isEqualTo("p1");
        assertThat(event.sellerId()).isEqualTo("s1");
        assertThat(event.price()).isEqualByComparingTo("199.99");
        assertThat(event.stock()).isEqualTo(15);
        assertThat(event.name()).isEqualTo("Test");
        assertThat(event.active()).isTrue();
    }

    @Test
    void should_PublishProductCreated_WithMinimalPayload_ToCorrectTopic() {
        publisher.publishProductCreated(sampleProduct());

        ArgumentCaptor<ProductCreatedEvent> captor = ArgumentCaptor.forClass(ProductCreatedEvent.class);
        verify(kafkaTemplate).send(eq(KafkaTopics.PRODUCT_CREATED), eq("p1"), captor.capture());

        ProductCreatedEvent event = captor.getValue();
        assertThat(event.productId()).isEqualTo("p1");
        assertThat(event.sellerId()).isEqualTo("s1");
        assertThat(event.stock()).isEqualTo(15);
    }

    @Test
    void should_PublishProductDeleted_ToCorrectTopic() {
        publisher.publishProductDeleted("p1");

        ArgumentCaptor<ProductDeletedEvent> captor = ArgumentCaptor.forClass(ProductDeletedEvent.class);
        verify(kafkaTemplate).send(eq(KafkaTopics.PRODUCT_DELETED), eq("p1"), captor.capture());

        assertThat(captor.getValue().productId()).isEqualTo("p1");
    }
}
