package com.marketplace.search.api.v1.controller;

import com.marketplace.search.api.v1.dto.response.SearchResponse;
import com.marketplace.search.application.service.ReindexService;
import com.marketplace.search.application.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Tag(name = "Search")
public class SearchController {

    private final SearchService searchService;
    private final ReindexService reindexService;

    @GetMapping
    @Operation(summary = "Search products with optional filters")
    public ResponseEntity<Page<SearchResponse>> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) BigDecimal priceMin,
            @RequestParam(required = false) BigDecimal priceMax,
            @RequestParam(required = false) String locale,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(
                searchService.searchWithFilters(query, categoryId, brand, priceMin, priceMax, locale, pageable));
    }

    @GetMapping("/seller/{sellerId}")
    @Operation(summary = "Get products by seller")
    public ResponseEntity<Page<SearchResponse>> searchBySeller(
            @PathVariable String sellerId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(searchService.searchBySeller(sellerId, pageable));
    }

    @PostMapping("/admin/reindex")
    @Operation(summary = "Re-index all products from product-service into Elasticsearch")
    public ResponseEntity<String> reindex() {
        int count = reindexService.reindexAll();
        return ResponseEntity.ok("Reindexed " + count + " products.");
    }
}
