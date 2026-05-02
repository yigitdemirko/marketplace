package com.marketplace.product.api.v1.controller;

import com.marketplace.product.api.v1.dto.request.CreateProductRequest;
import com.marketplace.product.api.v1.dto.request.UpdateProductRequest;
import com.marketplace.product.api.v1.dto.request.ValidateProductRequest;
import com.marketplace.product.api.v1.dto.response.BatchCreateResponse;
import com.marketplace.product.api.v1.dto.response.ProductResponse;
import com.marketplace.product.api.v1.dto.response.SellerCategoryResponse;
import com.marketplace.product.api.v1.dto.response.SellerStatsResponse;
import com.marketplace.product.api.v1.dto.response.ValidatedProductResponse;
import com.marketplace.product.application.service.ImageUploadService;
import com.marketplace.product.application.service.ProductService;
import com.marketplace.product.domain.model.Category;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Products", description = "Product catalog — browse, create, update, and manage inventory")
public class ProductController {

    private final ProductService productService;

    @Autowired(required = false)
    private ImageUploadService imageUploadService;

    @PostMapping("/images/upload")
    @Operation(summary = "Upload product image", description = "Uploads image to Hetzner Object Storage and returns the public URL. Max 5 MB, JPEG/PNG/WebP/GIF.")
    @SecurityRequirement(name = "cookieAuth")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Upload successful, returns {\"url\": \"...\"}"),
            @ApiResponse(responseCode = "400", description = "File too large or unsupported type"),
            @ApiResponse(responseCode = "503", description = "Storage not configured")
    })
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file) throws IOException {
        if (imageUploadService == null) {
            return ResponseEntity.status(503).body(Map.of("error", "Image upload is not configured"));
        }
        String url = imageUploadService.upload(file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping
    @Operation(summary = "Create product", description = "Creates a new product in the seller's catalog. Stock must be >= 0.")
    @SecurityRequirement(name = "cookieAuth")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Product created"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    public ResponseEntity<ProductResponse> createProduct(
            @RequestHeader("X-Seller-Id") String sellerId,
            @Valid @RequestBody CreateProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.createProduct(sellerId, request));
    }

    @PostMapping("/batch")
    @Operation(summary = "Batch create products", description = "Creates multiple products in a single request. Used by feed-ingestion-service for XML imports.")
    @SecurityRequirement(name = "cookieAuth")
    @ApiResponse(responseCode = "201", description = "Batch processed — check response for per-item success/error")
    public ResponseEntity<BatchCreateResponse> createProductsBatch(
            @RequestHeader("X-Seller-Id") String sellerId,
            @RequestBody List<CreateProductRequest> requests) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.createProductsBatch(sellerId, requests));
    }

    @PostMapping("/validate")
    @Operation(
            summary = "Validate product availability",
            description = "Internal endpoint called by order-service to verify stock and get server-authoritative prices. " +
                          "Returns current price, seller ID, and available stock per item."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Validation results (check valid field per item)"),
            @ApiResponse(responseCode = "400", description = "Invalid request")
    })
    public ResponseEntity<List<ValidatedProductResponse>> validateProducts(
            @Valid @RequestBody List<ValidateProductRequest> items) {
        return ResponseEntity.ok(productService.validateProducts(items));
    }

    @GetMapping("/seller/{sellerId}/stats")
    @Operation(summary = "Get seller catalog stats", description = "Returns total, in-stock, out-of-stock, and low-stock product counts for a seller.")
    public ResponseEntity<SellerStatsResponse> getSellerStats(@PathVariable String sellerId) {
        return ResponseEntity.ok(productService.getSellerStats(sellerId));
    }

    @GetMapping("/seller/{sellerId}/categories")
    @Operation(summary = "Get seller's active categories", description = "Returns distinct categories that have at least one active product from this seller.")
    public ResponseEntity<List<SellerCategoryResponse>> getSellerCategories(@PathVariable String sellerId) {
        return ResponseEntity.ok(productService.getSellerCategories(sellerId));
    }

    @GetMapping("/categories")
    @Operation(summary = "List all categories", description = "Returns all available product categories with their display names.")
    public ResponseEntity<List<Map<String, String>>> getCategories() {
        List<Map<String, String>> categories = Arrays.stream(Category.values())
                .map(c -> Map.of("id", c.name(), "label", c.getDisplayName()))
                .toList();
        return ResponseEntity.ok(categories);
    }

    @GetMapping
    @Operation(summary = "List products", description = "Returns all active products, paginated. Default page size 20.")
    public ResponseEntity<Page<ProductResponse>> getAllProducts(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(productService.getAllProducts(pageable));
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "List products by category")
    @ApiResponse(responseCode = "400", description = "Unknown category ID")
    public ResponseEntity<Page<ProductResponse>> getProductsByCategory(
            @PathVariable String categoryId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(productService.getProductsByCategory(categoryId, pageable));
    }

    @GetMapping("/seller/{sellerId}")
    @Operation(summary = "List products by seller", description = "Optionally filter by categoryId query param.")
    public ResponseEntity<Page<ProductResponse>> getProductsBySeller(
            @PathVariable String sellerId,
            @RequestParam(required = false) String categoryId,
            @PageableDefault(size = 20) Pageable pageable) {
        if (categoryId != null && !categoryId.isBlank()) {
            return ResponseEntity.ok(productService.getProductsBySellerAndCategory(sellerId, categoryId, pageable));
        }
        return ResponseEntity.ok(productService.getProductsBySeller(sellerId, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Product found"),
            @ApiResponse(responseCode = "404", description = "Product not found")
    })
    public ResponseEntity<ProductResponse> getProduct(@PathVariable String id) {
        return ResponseEntity.ok(productService.getProduct(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update product", description = "Seller updates their own product. Ownership is validated via X-Seller-Id.")
    @SecurityRequirement(name = "cookieAuth")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Product updated"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "401", description = "Not the product owner"),
            @ApiResponse(responseCode = "404", description = "Product not found")
    })
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable String id,
            @RequestHeader("X-Seller-Id") String sellerId,
            @Valid @RequestBody UpdateProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, sellerId, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product", description = "Soft-deletes (deactivates) a product. Ownership validated via X-Seller-Id.")
    @SecurityRequirement(name = "cookieAuth")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Product deleted"),
            @ApiResponse(responseCode = "401", description = "Not the product owner"),
            @ApiResponse(responseCode = "404", description = "Product not found")
    })
    public ResponseEntity<Void> deleteProduct(
            @PathVariable String id,
            @RequestHeader("X-Seller-Id") String sellerId) {
        productService.deleteProduct(id, sellerId);
        return ResponseEntity.noContent().build();
    }
}
