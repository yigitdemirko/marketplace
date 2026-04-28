package com.marketplace.search.api.v1.controller;

import com.marketplace.search.api.v1.dto.response.SearchResponse;
import com.marketplace.search.application.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<Page<SearchResponse>> search(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(searchService.search(query, pageable));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Page<SearchResponse>> searchByCategory(
            @PathVariable String categoryId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(searchService.searchByCategory(categoryId, pageable));
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<Page<SearchResponse>> searchBySeller(
            @PathVariable String sellerId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(searchService.searchBySeller(sellerId, pageable));
    }
}