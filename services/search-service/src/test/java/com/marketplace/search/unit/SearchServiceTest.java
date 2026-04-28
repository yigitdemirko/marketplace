package com.marketplace.search.unit;

import com.marketplace.search.api.v1.dto.response.SearchResponse;
import com.marketplace.search.application.service.SearchService;
import com.marketplace.search.domain.model.ProductDocument;
import com.marketplace.search.domain.repository.ProductSearchRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private ProductSearchRepository productSearchRepository;

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
    void should_SearchByQuery_When_QueryIsNotBlank() {
        ProductDocument doc = ProductDocument.builder()
                .id("prod-1")
                .name("Shoes")
                .price(BigDecimal.valueOf(150))
                .active(true)
                .build();

        when(productSearchRepository.findByNameContainingAndActiveTrue(anyString(), any()))
                .thenReturn(new PageImpl<>(List.of(doc)));

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

        when(productSearchRepository.findByCategoryIdAndActiveTrue(anyString(), any()))
                .thenReturn(new PageImpl<>(List.of(doc)));

        Page<SearchResponse> result = searchService.searchByCategory("cat-001", PageRequest.of(0, 20));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).categoryId()).isEqualTo("cat-001");
    }
}