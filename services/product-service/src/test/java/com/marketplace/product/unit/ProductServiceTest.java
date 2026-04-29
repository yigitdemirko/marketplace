package com.marketplace.product.unit;

import com.marketplace.product.api.v1.dto.request.CreateProductRequest;
import com.marketplace.product.api.v1.dto.response.ProductResponse;
import com.marketplace.product.application.service.ProductService;
import com.marketplace.product.domain.model.Product;
import com.marketplace.product.domain.repository.ProductRepository;
import com.marketplace.product.infrastructure.messaging.ProductEventPublisher;
import org.junit.jupiter.api.Tag;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductEventPublisher eventPublisher;

    @InjectMocks
    private ProductService productService;

    @Test
    void should_CreateProduct_Successfully() {
        CreateProductRequest request = new CreateProductRequest(
                "Test Product", "Description", BigDecimal.valueOf(99.99),
                100, "cat-001", null, null
        );

        Product mockProduct = Product.create("seller-123", request.name(),
                request.description(), request.price(), request.stock(), request.categoryId());

        when(productRepository.save(any())).thenReturn(mockProduct);

        ProductResponse response = productService.createProduct("seller-123", request);

        assertThat(response.name()).isEqualTo("Test Product");
        assertThat(response.price()).isEqualByComparingTo(BigDecimal.valueOf(99.99));
        assertThat(response.sellerId()).isEqualTo("seller-123");
    }

    @Test
    void should_GetAllProducts_WithPagination() {
        Product mockProduct = Product.create("seller-123", "Product",
                "Desc", BigDecimal.valueOf(50), 10, "cat-001");

        Page<Product> page = new PageImpl<>(List.of(mockProduct));
        when(productRepository.findByActiveTrue(any())).thenReturn(page);

        Page<ProductResponse> result = productService.getAllProducts(PageRequest.of(0, 20));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).name()).isEqualTo("Product");
    }

    @Test
    void should_ThrowException_When_ProductNotFound() {
        when(productRepository.findById("non-existent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProduct("non-existent"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Product not found");
    }

    @Test
    void should_ThrowException_When_UnauthorizedSeller() {
        Product mockProduct = Product.create("seller-123", "Product",
                "Desc", BigDecimal.valueOf(50), 10, "cat-001");

        when(productRepository.findById(any())).thenReturn(Optional.of(mockProduct));

        assertThatThrownBy(() -> productService.deleteProduct("product-id", "other-seller"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Unauthorized");
    }
}