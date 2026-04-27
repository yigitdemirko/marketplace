package com.marketplace.product.application.service;

import com.marketplace.product.api.v1.dto.request.CreateProductRequest;
import com.marketplace.product.api.v1.dto.request.UpdateProductRequest;
import com.marketplace.product.api.v1.dto.response.ProductResponse;
import com.marketplace.product.domain.model.Product;
import com.marketplace.product.domain.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public ProductResponse createProduct(String sellerId, CreateProductRequest request) {
        Product product = Product.create(
                sellerId,
                request.name(),
                request.description(),
                request.price(),
                request.stock(),
                request.categoryId()
        );

        if (request.images() != null) product.setImages(request.images());
        if (request.attributes() != null) product.setAttributes(request.attributes());

        return toResponse(productRepository.save(product));
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
        if (request.categoryId() != null) product.setCategoryId(request.categoryId());
        if (request.images() != null) product.setImages(request.images());
        if (request.attributes() != null) product.setAttributes(request.attributes());

        return toResponse(productRepository.save(product));
    }

    public void deleteProduct(String id, String sellerId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getSellerId().equals(sellerId)) {
            throw new RuntimeException("Unauthorized");
        }

        product.setActive(false);
        productRepository.save(product);
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
                product.getImages(),
                product.getAttributes(),
                product.isActive(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}