package com.marketplace.product.domain.repository;

import com.marketplace.product.domain.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ProductRepository extends MongoRepository<Product, String> {

    Page<Product> findByActiveTrue(Pageable pageable);

    Page<Product> findByCategoryIdAndActiveTrue(String categoryId, Pageable pageable);

    Page<Product> findBySellerIdAndActiveTrue(String sellerId, Pageable pageable);

    List<Product> findByIdInAndActiveTrue(List<String> ids);

    long countBySellerIdAndActiveTrue(String sellerId);

    long countBySellerIdAndActiveTrueAndStock(String sellerId, int stock);

    long countBySellerIdAndActiveTrueAndStockGreaterThan(String sellerId, int stock);

    long countBySellerIdAndActiveTrueAndStockBetween(String sellerId, int lowInclusive, int highInclusive);
}