package com.marketplace.product.api.v1.controller;

import com.marketplace.product.api.v1.dto.request.CreateProductRequest;
import com.marketplace.product.api.v1.dto.request.UpdateProductRequest;
import com.marketplace.product.api.v1.dto.request.ValidateProductRequest;
import com.marketplace.product.api.v1.dto.response.BatchCreateResponse;
import com.marketplace.product.api.v1.dto.response.ProductResponse;
import com.marketplace.product.api.v1.dto.response.SellerCategoryResponse;
import com.marketplace.product.api.v1.dto.response.SellerLocaleResponse;
import com.marketplace.product.api.v1.dto.response.SellerStatsResponse;
import com.marketplace.product.api.v1.dto.response.ValidatedProductResponse;
import com.marketplace.product.application.service.ImageUploadService;
import com.marketplace.product.application.service.ProductService;
import com.marketplace.product.domain.model.Category;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @Autowired(required = false)
    private ImageUploadService imageUploadService;

    @PostMapping("/images/upload")
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file) throws IOException {
        if (imageUploadService == null) {
            return ResponseEntity.status(503).body(Map.of("error", "Image upload is not configured"));
        }
        String url = imageUploadService.upload(file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @RequestHeader("X-Seller-Id") String sellerId,
            @Valid @RequestBody CreateProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.createProduct(sellerId, request));
    }

    @PostMapping("/batch")
    public ResponseEntity<BatchCreateResponse> createProductsBatch(
            @RequestHeader("X-Seller-Id") String sellerId,
            @RequestBody List<CreateProductRequest> requests) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.createProductsBatch(sellerId, requests));
    }

    @PostMapping("/validate")
    public ResponseEntity<List<ValidatedProductResponse>> validateProducts(
            @Valid @RequestBody List<ValidateProductRequest> items) {
        return ResponseEntity.ok(productService.validateProducts(items));
    }

    @GetMapping("/seller/{sellerId}/stats")
    public ResponseEntity<SellerStatsResponse> getSellerStats(@PathVariable String sellerId) {
        return ResponseEntity.ok(productService.getSellerStats(sellerId));
    }

    @GetMapping("/seller/{sellerId}/categories")
    public ResponseEntity<List<SellerCategoryResponse>> getSellerCategories(@PathVariable String sellerId) {
        return ResponseEntity.ok(productService.getSellerCategories(sellerId));
    }

    @GetMapping("/seller/{sellerId}/locales")
    public ResponseEntity<List<SellerLocaleResponse>> getSellerLocales(@PathVariable String sellerId) {
        return ResponseEntity.ok(productService.getSellerLocales(sellerId));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, String>>> getCategories() {
        List<Map<String, String>> categories = Arrays.stream(Category.values())
                .map(c -> Map.of("id", c.name(), "label", c.getDisplayName()))
                .toList();
        return ResponseEntity.ok(categories);
    }

    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getAllProducts(
            @RequestParam(required = false) String locale,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(productService.getAllProducts(locale, pageable));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Page<ProductResponse>> getProductsByCategory(
            @PathVariable String categoryId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(productService.getProductsByCategory(categoryId, pageable));
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<Page<ProductResponse>> getProductsBySeller(
            @PathVariable String sellerId,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String locale,
            @PageableDefault(size = 20) Pageable pageable) {
        if (categoryId != null && !categoryId.isBlank()) {
            return ResponseEntity.ok(productService.getProductsBySellerAndCategory(sellerId, categoryId, pageable));
        }
        if (locale != null && !locale.isBlank()) {
            return ResponseEntity.ok(productService.getProductsBySellerAndLocale(sellerId, locale, pageable));
        }
        return ResponseEntity.ok(productService.getProductsBySeller(sellerId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable String id) {
        return ResponseEntity.ok(productService.getProduct(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable String id,
            @RequestHeader("X-Seller-Id") String sellerId,
            @Valid @RequestBody UpdateProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, sellerId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable String id,
            @RequestHeader("X-Seller-Id") String sellerId) {
        productService.deleteProduct(id, sellerId);
        return ResponseEntity.noContent().build();
    }
}