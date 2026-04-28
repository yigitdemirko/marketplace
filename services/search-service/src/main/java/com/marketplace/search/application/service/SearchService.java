package com.marketplace.search.application.service;

import com.marketplace.search.api.v1.dto.response.SearchResponse;
import com.marketplace.search.domain.model.ProductDocument;
import com.marketplace.search.domain.repository.ProductSearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final ProductSearchRepository productSearchRepository;

    public Page<SearchResponse> search(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return productSearchRepository.findByActiveTrue(pageable).map(this::toResponse);
        }
        return productSearchRepository.findByNameContainingAndActiveTrue(query, pageable).map(this::toResponse);
    }

    public Page<SearchResponse> searchByCategory(String categoryId, Pageable pageable) {
        return productSearchRepository.findByCategoryIdAndActiveTrue(categoryId, pageable).map(this::toResponse);
    }

    public Page<SearchResponse> searchBySeller(String sellerId, Pageable pageable) {
        return productSearchRepository.findBySellerIdAndActiveTrue(sellerId, pageable).map(this::toResponse);
    }

    public void indexProduct(ProductDocument document) {
        productSearchRepository.save(document);
    }

    public void removeProduct(String productId) {
        productSearchRepository.deleteById(productId);
    }

    private SearchResponse toResponse(ProductDocument doc) {
        return new SearchResponse(
                doc.getId(),
                doc.getName(),
                doc.getDescription(),
                doc.getSellerId(),
                doc.getCategoryId(),
                doc.getPrice(),
                doc.getStock(),
                doc.isActive(),
                doc.getImages(),
                doc.getAttributes()
        );
    }
}