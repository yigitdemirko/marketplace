package com.marketplace.search.infrastructure.messaging;

import com.marketplace.search.application.service.SearchService;
import com.marketplace.search.domain.model.ProductDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductEventConsumer {

    private final SearchService searchService;

    @KafkaListener(topics = "product.updated", groupId = "search-service")
    public void handleProductUpdated(Map<String, Object> event) {
        log.info("Product event received: productId={}", event.get("id"));

        ProductDocument document = ProductDocument.builder()
                .id((String) event.get("id"))
                .sellerId((String) event.get("sellerId"))
                .name((String) event.get("name"))
                .description((String) event.get("description"))
                .price(event.get("price") != null ?
                        new BigDecimal(event.get("price").toString()) : null)
                .stock(event.get("stock") != null ?
                        ((Number) event.get("stock")).intValue() : null)
                .categoryId((String) event.get("categoryId"))
                .locale((String) event.get("locale"))
                .brand((String) event.get("brand"))
                .images((List<String>) event.get("images"))
                .attributes((Map<String, String>) event.get("attributes"))
                .active(Boolean.TRUE.equals(event.get("active")))
                .build();

        searchService.indexProduct(document);
        log.info("Product indexed in Elasticsearch: productId={}", document.getId());
    }
}