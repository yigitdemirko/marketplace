package com.marketplace.product.application.service;

import com.marketplace.product.api.v1.dto.request.CreateProductRequest;
import com.marketplace.product.api.v1.dto.request.UpdateProductRequest;
import com.marketplace.product.api.v1.dto.request.ValidateProductRequest;
import com.marketplace.product.api.v1.dto.response.BatchCreateFailure;
import com.marketplace.product.api.v1.dto.response.BatchCreateResponse;
import com.marketplace.product.api.v1.dto.response.ProductResponse;
import com.marketplace.product.api.v1.dto.response.SellerCategoryResponse;
import com.marketplace.product.api.v1.dto.response.SellerStatsResponse;
import com.marketplace.product.api.v1.dto.response.ValidatedProductResponse;
import com.marketplace.product.domain.model.Product;
import com.marketplace.product.domain.repository.ProductRepository;
import com.marketplace.product.infrastructure.messaging.ProductEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private static final int LOW_STOCK_THRESHOLD = 10;

    private final ProductRepository productRepository;
    private final ProductEventPublisher eventPublisher;

    public ProductResponse createProduct(String sellerId, CreateProductRequest request) {
        Product product = buildProduct(sellerId, request);
        Product saved = productRepository.save(product);
        eventPublisher.publishProductCreated(saved);
        eventPublisher.publishProductUpdated(saved);
        return toResponse(saved);
    }

    public BatchCreateResponse createProductsBatch(String sellerId, List<CreateProductRequest> requests) {
        List<String> createdIds = new ArrayList<>();
        List<BatchCreateFailure> failures = new ArrayList<>();

        for (int i = 0; i < requests.size(); i++) {
            CreateProductRequest request = requests.get(i);
            try {
                Product product = buildProduct(sellerId, request);
                Product saved = productRepository.save(product);
                eventPublisher.publishProductCreated(saved);
                eventPublisher.publishProductUpdated(saved);
                createdIds.add(saved.getId());
            } catch (Exception ex) {
                log.warn("Batch row {} failed: {}", i, ex.getMessage());
                failures.add(new BatchCreateFailure(i, ex.getMessage()));
            }
        }

        return new BatchCreateResponse(
                requests.size(),
                createdIds.size(),
                failures.size(),
                createdIds,
                failures
        );
    }

    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findByActiveTrue(pageable).map(this::toResponse);
    }

    public Page<ProductResponse> getProductsByCategory(String categoryId, Pageable pageable) {
        return productRepository.findByCategoryIdAndActiveTrue(categoryId, pageable).map(this::toResponse);
    }

    public Page<ProductResponse> getProductsBySeller(String sellerId, Pageable pageable) {
        return productRepository.findBySellerIdAndActiveTrue(sellerId, pageable).map(this::toResponse);
    }

    public Page<ProductResponse> getProductsBySellerAndCategory(String sellerId, String categoryId, Pageable pageable) {
        return productRepository.findBySellerIdAndCategoryIdAndActiveTrue(sellerId, categoryId, pageable)
                .map(this::toResponse);
    }

    public List<SellerCategoryResponse> getSellerCategories(String sellerId) {
        return productRepository.aggregateCategoryCountsBySellerId(sellerId).stream()
                .map(c -> new SellerCategoryResponse(c.getCategoryId(), c.getCount()))
                .toList();
    }

    public List<ValidatedProductResponse> validateProducts(List<ValidateProductRequest> items) {
        List<String> ids = items.stream().map(ValidateProductRequest::productId).toList();
        Map<String, Product> productsById = new HashMap<>();
        productRepository.findByIdInAndActiveTrue(ids).forEach(p -> productsById.put(p.getId(), p));

        List<ValidatedProductResponse> results = new ArrayList<>(items.size());
        for (ValidateProductRequest item : items) {
            Product product = productsById.get(item.productId());
            if (product == null) {
                results.add(new ValidatedProductResponse(
                        item.productId(), false, null, null, null, "Product not found or inactive"));
                continue;
            }
            if (product.getStock() < item.quantity()) {
                results.add(new ValidatedProductResponse(
                        item.productId(), false, product.getSellerId(), product.getPrice(),
                        product.getStock(), "Insufficient stock"));
                continue;
            }
            results.add(new ValidatedProductResponse(
                    item.productId(), true, product.getSellerId(), product.getPrice(),
                    product.getStock(), null));
        }
        return results;
    }

    public SellerStatsResponse getSellerStats(String sellerId) {
        long total = productRepository.countBySellerIdAndActiveTrue(sellerId);
        long outOfStock = productRepository.countBySellerIdAndActiveTrueAndStock(sellerId, 0);
        long lowStock = productRepository.countBySellerIdAndActiveTrueAndStockBetween(
                sellerId, 1, LOW_STOCK_THRESHOLD - 1);
        long inStock = total - outOfStock;
        return new SellerStatsResponse(total, inStock, outOfStock, lowStock);
    }

    public ProductResponse getProduct(String id) {
        return productRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public ProductResponse updateProduct(String id, String sellerId, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getSellerId().equals(sellerId)) {
            throw new RuntimeException("Unauthorized");
        }

        if (request.name() != null) product.setName(request.name());
        if (request.description() != null) product.setDescription(request.description());
        if (request.price() != null) product.setPrice(request.price());
        if (request.stock() != null) product.setStock(request.stock());
        if (request.category() != null) product.setCategoryId(request.category().name());
        if (request.brand() != null) product.setBrand(request.brand());
        if (request.images() != null) product.setImages(request.images());
        if (request.attributes() != null) product.setAttributes(request.attributes());

        Product saved = productRepository.save(product);
        eventPublisher.publishProductUpdated(saved);
        return toResponse(saved);
    }

    public void deleteProduct(String id, String sellerId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getSellerId().equals(sellerId)) {
            throw new RuntimeException("Unauthorized");
        }

        product.setActive(false);
        Product saved = productRepository.save(product);
        eventPublisher.publishProductUpdated(saved);
        eventPublisher.publishProductDeleted(saved.getId());
    }

    private Product buildProduct(String sellerId, CreateProductRequest request) {
        Product product = Product.create(
                sellerId,
                request.name(),
                request.description(),
                request.price(),
                request.stock(),
                request.category().name()
        );
        product.setBrand(request.brand());
        if (request.images() != null) product.setImages(request.images());
        if (request.attributes() != null) product.setAttributes(request.attributes());
        return product;
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getSellerId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getCategoryId(),
                product.getBrand(),
                product.getImages(),
                product.getAttributes(),
                product.isActive(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
