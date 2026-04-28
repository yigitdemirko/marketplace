package com.marketplace.search.domain.repository;

import com.marketplace.search.domain.model.ProductDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface ProductSearchRepository extends ElasticsearchRepository<ProductDocument, String> {

    Page<ProductDocument> findByNameContainingAndActiveTrue(String name, Pageable pageable);

    Page<ProductDocument> findByCategoryIdAndActiveTrue(String categoryId, Pageable pageable);

    Page<ProductDocument> findBySellerIdAndActiveTrue(String sellerId, Pageable pageable);

    Page<ProductDocument> findByActiveTrue(Pageable pageable);
}