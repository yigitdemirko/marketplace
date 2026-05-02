package com.marketplace.search.api.v1.controller;

import com.marketplace.search.api.v1.dto.response.SearchResponse;
import com.marketplace.search.application.service.ReindexService;
import com.marketplace.search.application.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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
@Tag(name = "Search", description = "Full-text product search powered by Elasticsearch")
public class SearchController {

    private final SearchService searchService;
    private final ReindexService reindexService;

    @GetMapping
    @Operation(
            summary = "Search products",
            description = "Full-text search across product name, description, and brand. " +
                          "Supports optional filters: categoryId, brand, priceMin, priceMax. " +
                          "Results are paginated — default page size 20."
    )
    public ResponseEntity<Page<SearchResponse>> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) BigDecimal priceMin,
            @RequestParam(required = false) BigDecimal priceMax,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(
                searchService.searchWithFilters(query, categoryId, brand, priceMin, priceMax, pageable));
    }

    @GetMapping("/seller/{sellerId}")
    @Operation(summary = "Get products by seller", description = "Returns all indexed products for a given seller, paginated.")
    public ResponseEntity<Page<SearchResponse>> searchBySeller(
            @PathVariable String sellerId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(searchService.searchBySeller(sellerId, pageable));
    }

    @PostMapping("/admin/reindex")
    @Operation(
            summary = "Re-index all products",
            description = "Fetches all products from product-service and rebuilds the Elasticsearch index. " +
                          "Admin operation — run after bulk imports or index corruption."
    )
    @ApiResponse(responseCode = "200", description = "Re-index complete, returns count of indexed products")
    public ResponseEntity<String> reindex() {
        int count = reindexService.reindexAll();
        return ResponseEntity.ok("Reindexed " + count + " products.");
    }
}
