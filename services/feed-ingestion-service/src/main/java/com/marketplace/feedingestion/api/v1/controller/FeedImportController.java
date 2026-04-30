package com.marketplace.feedingestion.api.v1.controller;

import com.marketplace.feedingestion.api.v1.dto.response.ImportJobResponse;
import com.marketplace.feedingestion.application.service.FeedImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/feeds")
@RequiredArgsConstructor
public class FeedImportController {

    private final FeedImportService feedImportService;

    @PostMapping("/import")
    public ResponseEntity<ImportJobResponse> importFeed(
            @RequestHeader("X-Seller-Id") String sellerId,
            @RequestParam("file") MultipartFile file) {
        ImportJobResponse response = feedImportService.importFeed(sellerId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/imports")
    public ResponseEntity<Page<ImportJobResponse>> listImports(
            @RequestHeader("X-Seller-Id") String sellerId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(feedImportService.listImports(sellerId, pageable));
    }

    @GetMapping("/imports/{jobId}")
    public ResponseEntity<ImportJobResponse> getImport(
            @RequestHeader("X-Seller-Id") String sellerId,
            @PathVariable UUID jobId) {
        return ResponseEntity.ok(feedImportService.getImport(jobId, sellerId));
    }
}
