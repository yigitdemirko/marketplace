package com.marketplace.basket.application.service;

import com.marketplace.basket.api.v1.dto.response.BasketItemResponse;
import com.marketplace.basket.api.v1.dto.response.BasketResponse;
import com.marketplace.basket.domain.model.Basket;
import com.marketplace.basket.infrastructure.client.CatalogGateway;
import com.marketplace.basket.infrastructure.client.CatalogProductDto;
import com.marketplace.basket.infrastructure.client.ValidateItemRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class BasketHydrator {

    private final CatalogGateway catalogGateway;

    public BasketResponse hydrate(Basket basket) {
        Map<String, Integer> items = basket.getItems();
        if (items.isEmpty()) {
            return new BasketResponse(basket.getUserId(), List.of(), 0, BigDecimal.ZERO, true, basket.getUpdatedAt());
        }

        List<ValidateItemRequest> requests = items.entrySet().stream()
                .map(e -> new ValidateItemRequest(e.getKey(), e.getValue()))
                .toList();

        List<CatalogProductDto> validated = catalogGateway.validate(requests);
        boolean hydrated = !validated.isEmpty();

        Map<String, CatalogProductDto> byId = new HashMap<>();
        validated.forEach(v -> byId.put(v.productId(), v));

        List<BasketItemResponse> responses = new ArrayList<>(items.size());
        BigDecimal total = BigDecimal.ZERO;
        int totalItems = 0;

        for (Map.Entry<String, Integer> entry : items.entrySet()) {
            String productId = entry.getKey();
            int quantity = entry.getValue();
            totalItems += quantity;

            CatalogProductDto product = byId.get(productId);
            if (product == null) {
                responses.add(new BasketItemResponse(
                        productId, quantity, null, null, null, null, null,
                        null, null, false,
                        hydrated ? "Product not found or inactive" : "Catalog unavailable"
                ));
                continue;
            }

            BigDecimal price = product.currentPrice();
            BigDecimal lineTotal = price != null ? price.multiply(BigDecimal.valueOf(quantity)) : null;
            if (lineTotal != null) {
                total = total.add(lineTotal);
            }

            responses.add(new BasketItemResponse(
                    productId,
                    quantity,
                    product.name(),
                    product.imageUrl(),
                    product.brand(),
                    product.sellerId(),
                    price,
                    lineTotal,
                    product.availableStock(),
                    product.valid(),
                    product.valid() ? null : product.reason()
            ));
        }

        return new BasketResponse(basket.getUserId(), responses, totalItems, total, hydrated, basket.getUpdatedAt());
    }
}
