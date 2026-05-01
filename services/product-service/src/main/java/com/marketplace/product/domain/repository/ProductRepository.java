package com.marketplace.product.domain.repository;

import com.marketplace.product.domain.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ProductRepository extends MongoRepository<Product, String> {

    Page<Product> findByActiveTrue(Pageable pageable);

    Page<Product> findByCategoryIdAndActiveTrue(String categoryId, Pageable pageable);

    Page<Product> findBySellerIdAndActiveTrue(String sellerId, Pageable pageable);

    Page<Product> findBySellerIdAndCategoryIdAndActiveTrue(String sellerId, String categoryId, Pageable pageable);

    List<Product> findByIdInAndActiveTrue(List<String> ids);

    long countBySellerIdAndActiveTrue(String sellerId);

    long countBySellerIdAndActiveTrueAndStock(String sellerId, int stock);

    long countBySellerIdAndActiveTrueAndStockGreaterThan(String sellerId, int stock);

    long countBySellerIdAndActiveTrueAndStockBetween(String sellerId, int lowInclusive, int highInclusive);

    @Aggregation(pipeline = {
            "{ $match: { sellerId: ?0, active: true } }",
            "{ $group: { _id: '$categoryId', count: { $sum: 1 } } }",
            "{ $project: { _id: 0, categoryId: '$_id', count: 1 } }",
            "{ $sort: { count: -1, categoryId: 1 } }"
    })
    List<SellerCategoryCount> aggregateCategoryCountsBySellerId(String sellerId);

    interface SellerCategoryCount {
        String getCategoryId();
        long getCount();
    }
}