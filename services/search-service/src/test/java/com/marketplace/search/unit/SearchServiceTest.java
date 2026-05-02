package com.marketplace.search.unit;

import com.marketplace.search.api.v1.dto.response.SearchResponse;
import com.marketplace.search.application.service.SearchService;
import com.marketplace.search.domain.model.ProductDocument;
import com.marketplace.search.domain.repository.ProductSearchRepository;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private ProductSearchRepository productSearchRepository;

    @Mock
    private ElasticsearchOperations elasticsearchOperations;

    @InjectMocks
    private SearchService searchService;

    @Test
    void should_ReturnAllProducts_When_QueryIsBlank() {
        ProductDocument doc = ProductDocument.builder()
                .id("prod-1")
                .name("Test Product")
                .price(BigDecimal.valueOf(99.99))
                .active(true)
                .build();

        when(productSearchRepository.findByActiveTrue(any()))
                .thenReturn(new PageImpl<>(List.of(doc)));

        Page<SearchResponse> result = searchService.search("", PageRequest.of(0, 20));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).name()).isEqualTo("Test Product");
    }

    @Test
    @SuppressWarnings("unchecked")
    void should_SearchByQuery_When_QueryIsNotBlank() {
        ProductDocument doc = ProductDocument.builder()
                .id("prod-1")
                .name("Shoes")
                .price(BigDecimal.valueOf(150))
                .active(true)
                .build();

        SearchHit<ProductDocument> hit = mock(SearchHit.class);
        when(hit.getContent()).thenReturn(doc);

        SearchHits<ProductDocument> hits = mock(SearchHits.class);
        when(hits.getSearchHits()).thenReturn(List.of(hit));
        when(hits.getTotalHits()).thenReturn(1L);

        when(elasticsearchOperations.search(any(NativeQuery.class), eq(ProductDocument.class))).thenReturn(hits);

        Page<SearchResponse> result = searchService.search("Shoes", PageRequest.of(0, 20));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).name()).isEqualTo("Shoes");
    }

    @Test
    void should_IndexProduct_Successfully() {
        ProductDocument doc = ProductDocument.builder()
                .id("prod-1")
                .name("Test Product")
                .active(true)
                .build();

        when(productSearchRepository.save(any())).thenReturn(doc);

        searchService.indexProduct(doc);
    }

    @Test
    void should_SearchByCategory_Successfully() {
        ProductDocument doc = ProductDocument.builder()
                .id("prod-1")
                .name("Shoes")
                .categoryId("cat-001")
                .active(true)
                .build();

        when(productSearchRepository.findByCategoryIdAndActiveTrue(any(), any()))
                .thenReturn(new PageImpl<>(List.of(doc)));

        Page<SearchResponse> result = searchService.searchByCategory("cat-001", PageRequest.of(0, 20));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).categoryId()).isEqualTo("cat-001");
    }

    @Test
    void should_SearchBySeller_Successfully() {
        ProductDocument doc = ProductDocument.builder()
                .id("prod-1")
                .name("Headphones")
                .sellerId("seller-1")
                .active(true)
                .build();

        when(productSearchRepository.findBySellerIdAndActiveTrue(any(), any()))
                .thenReturn(new PageImpl<>(List.of(doc)));

        Page<SearchResponse> result = searchService.searchBySeller("seller-1", PageRequest.of(0, 20));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).sellerId()).isEqualTo("seller-1");
    }

    @Test
    void should_RemoveProduct() {
        searchService.removeProduct("prod-1");

        org.mockito.Mockito.verify(productSearchRepository).deleteById("prod-1");
    }

    @Test
    @SuppressWarnings("unchecked")
    void should_ApplyAllFilters_When_QueryAndCategoryAndBrandAndPriceProvided() {
        ProductDocument doc = ProductDocument.builder()
                .id("p1")
                .name("Black Sneaker")
                .categoryId("cat-shoes")
                .brand("Nike")
                .price(BigDecimal.valueOf(120))
                .active(true)
                .build();

        SearchHit<ProductDocument> hit = mock(SearchHit.class);
        when(hit.getContent()).thenReturn(doc);
        SearchHits<ProductDocument> hits = mock(SearchHits.class);
        when(hits.getSearchHits()).thenReturn(List.of(hit));
        when(hits.getTotalHits()).thenReturn(1L);
        when(elasticsearchOperations.search(any(NativeQuery.class), eq(ProductDocument.class))).thenReturn(hits);

        Page<SearchResponse> result = searchService.searchWithFilters(
                "sneaker", "cat-shoes", "Nike",
                BigDecimal.valueOf(50), BigDecimal.valueOf(200),
                PageRequest.of(0, 20));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).brand()).isEqualTo("Nike");
    }

    @Test
    @SuppressWarnings("unchecked")
    void should_OnlyApplyActiveFilter_When_AllOptionalFiltersBlank() {
        SearchHits<ProductDocument> hits = mock(SearchHits.class);
        when(hits.getSearchHits()).thenReturn(List.of());
        when(hits.getTotalHits()).thenReturn(0L);
        when(elasticsearchOperations.search(any(NativeQuery.class), eq(ProductDocument.class))).thenReturn(hits);

        Page<SearchResponse> result = searchService.searchWithFilters(
                null, "", "  ", null, null, PageRequest.of(0, 20));

        assertThat(result.getTotalElements()).isZero();
    }

    @Test
    @SuppressWarnings("unchecked")
    void should_ApplyOnlyMinPrice_When_MaxPriceIsNull() {
        SearchHits<ProductDocument> hits = mock(SearchHits.class);
        when(hits.getSearchHits()).thenReturn(List.of());
        when(hits.getTotalHits()).thenReturn(0L);
        when(elasticsearchOperations.search(any(NativeQuery.class), eq(ProductDocument.class))).thenReturn(hits);

        Page<SearchResponse> result = searchService.searchWithFilters(
                null, null, null, BigDecimal.valueOf(100), null, PageRequest.of(0, 20));

        assertThat(result.getTotalElements()).isZero();
    }
}
