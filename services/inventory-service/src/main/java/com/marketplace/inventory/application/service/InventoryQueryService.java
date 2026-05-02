package com.marketplace.inventory.application.service;

import com.marketplace.inventory.api.v1.dto.SellerStockStatsResponse;
import com.marketplace.inventory.api.v1.dto.StockResponse;
import com.marketplace.inventory.domain.model.ProductStock;
import com.marketplace.inventory.domain.repository.ProductStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InventoryQueryService {

    private static final int LOW_STOCK_THRESHOLD = 10;

    private final ProductStockRepository repository;

    public Optional<StockResponse> findByProductId(String productId) {
        return repository.findById(productId).map(this::toResponse);
    }

    public List<StockResponse> findByProductIds(List<String> productIds) {
        return repository.findByProductIdIn(productIds).stream()
                .map(this::toResponse)
                .toList();
    }

    public SellerStockStatsResponse getSellerStats(String sellerId, long totalActiveProducts) {
        long outOfStock = repository.countBySellerIdAndStock(sellerId, 0);
        long lowStock = repository.countBySellerIdAndStockBetween(sellerId, 1, LOW_STOCK_THRESHOLD - 1);
        long inStock = Math.max(0, totalActiveProducts - outOfStock);
        return new SellerStockStatsResponse(inStock, outOfStock, lowStock);
    }

    private StockResponse toResponse(ProductStock stock) {
        return new StockResponse(stock.getProductId(), stock.getSellerId(), stock.getStock());
    }
}
