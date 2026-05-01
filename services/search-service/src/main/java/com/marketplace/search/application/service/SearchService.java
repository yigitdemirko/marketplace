package com.marketplace.search.application.service;

import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.MultiMatchQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.NumberRangeQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.RangeQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.TermQuery;
import com.marketplace.search.api.v1.dto.response.SearchResponse;
import com.marketplace.search.domain.model.ProductDocument;
import com.marketplace.search.domain.repository.ProductSearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final ProductSearchRepository productSearchRepository;
    private final ElasticsearchOperations elasticsearchOperations;

    public Page<SearchResponse> searchWithFilters(
            String query,
            String categoryId,
            String brand,
            BigDecimal priceMin,
            BigDecimal priceMax,
            Pageable pageable) {

        BoolQuery.Builder bool = new BoolQuery.Builder();
        bool.filter(TermQuery.of(t -> t.field("active").value(true))._toQuery());

        if (query != null && !query.isBlank()) {
            bool.must(MultiMatchQuery.of(m -> m.query(query).fields("name", "description"))._toQuery());
        }

        if (categoryId != null && !categoryId.isBlank()) {
            bool.filter(TermQuery.of(t -> t.field("categoryId").value(categoryId))._toQuery());
        }

        if (brand != null && !brand.isBlank()) {
            bool.filter(TermQuery.of(t -> t.field("brand").value(brand))._toQuery());
        }

        if (priceMin != null || priceMax != null) {
            NumberRangeQuery.Builder nb = new NumberRangeQuery.Builder().field("price");
            if (priceMin != null) nb.gte(priceMin.doubleValue());
            if (priceMax != null) nb.lte(priceMax.doubleValue());
            NumberRangeQuery numberRange = nb.build();
            bool.filter(RangeQuery.of(r -> r.number(numberRange))._toQuery());
        }

        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(bool.build()._toQuery())
                .withPageable(pageable)
                .build();

        SearchHits<ProductDocument> hits = elasticsearchOperations.search(nativeQuery, ProductDocument.class);
        List<SearchResponse> content = hits.getSearchHits().stream()
                .map(hit -> toResponse(hit.getContent()))
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, hits.getTotalHits());
    }

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
                doc.getAttributes(),
                doc.getBrand()
        );
    }
}
