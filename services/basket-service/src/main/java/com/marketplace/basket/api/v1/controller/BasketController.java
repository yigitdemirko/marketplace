package com.marketplace.basket.api.v1.controller;

import com.marketplace.basket.api.v1.dto.request.AddItemRequest;
import com.marketplace.basket.api.v1.dto.request.MergeBasketRequest;
import com.marketplace.basket.api.v1.dto.request.SetItemRequest;
import com.marketplace.basket.api.v1.dto.response.BasketResponse;
import com.marketplace.basket.application.service.BasketHydrator;
import com.marketplace.basket.application.service.BasketService;
import com.marketplace.basket.domain.model.Basket;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Basket", description = "Server-side shopping basket")
@RestController
@RequestMapping("/api/v1/basket")
@RequiredArgsConstructor
@SecurityRequirement(name = "cookieAuth")
public class BasketController {

    private final BasketService basketService;
    private final BasketHydrator hydrator;

    @GetMapping
    @Operation(summary = "Get current user's basket (hydrated with product details)")
    public ResponseEntity<BasketResponse> getBasket(@RequestHeader("X-User-Id") String userId) {
        Basket basket = basketService.get(userId);
        return ResponseEntity.ok(hydrator.hydrate(basket));
    }

    @PostMapping("/items")
    @Operation(summary = "Add to basket (sums with existing quantity)")
    public ResponseEntity<BasketResponse> addItem(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody AddItemRequest request) {
        Basket basket = basketService.addItem(userId, request.productId(), request.quantity());
        return ResponseEntity.ok(hydrator.hydrate(basket));
    }

    @PatchMapping("/items/{productId}")
    @Operation(summary = "Set quantity for an item (0 removes it)")
    public ResponseEntity<BasketResponse> setItem(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String productId,
            @Valid @RequestBody SetItemRequest request) {
        Basket basket = basketService.setItem(userId, productId, request.quantity());
        return ResponseEntity.ok(hydrator.hydrate(basket));
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove an item from basket")
    public ResponseEntity<BasketResponse> removeItem(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String productId) {
        Basket basket = basketService.removeItem(userId, productId);
        return ResponseEntity.ok(hydrator.hydrate(basket));
    }

    @DeleteMapping
    @Operation(summary = "Clear basket")
    public ResponseEntity<Void> clear(@RequestHeader("X-User-Id") String userId) {
        basketService.clear(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/merge")
    @Operation(summary = "Merge anonymous cart into server basket on login (max-quantity strategy)")
    public ResponseEntity<BasketResponse> merge(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody MergeBasketRequest request) {
        var items = request.items().stream()
                .map(i -> new BasketService.MergeItem(i.productId(), i.quantity()))
                .toList();
        Basket basket = basketService.merge(userId, items);
        return ResponseEntity.ok(hydrator.hydrate(basket));
    }
}
