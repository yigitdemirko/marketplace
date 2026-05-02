package com.marketplace.inventory.domain.repository;

import com.marketplace.inventory.domain.model.ProductStock;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ProductStockRepository extends MongoRepository<ProductStock, String> {

    List<ProductStock> findByProductIdIn(List<String> productIds);

    long countBySellerIdAndStock(String sellerId, int stock);

    long countBySellerIdAndStockBetween(String sellerId, int lowInclusive, int highInclusive);
}
