package com.marketplace.catalog.unit;

import com.marketplace.common.exception.NotFoundException;
import com.marketplace.common.exception.UnauthorizedException;
import com.marketplace.catalog.api.v1.dto.request.CreateProductRequest;
import com.marketplace.catalog.api.v1.dto.request.UpdateProductRequest;
import com.marketplace.catalog.api.v1.dto.request.ValidateProductRequest;
import com.marketplace.catalog.api.v1.dto.response.ProductResponse;
import com.marketplace.catalog.api.v1.dto.response.SellerStatsResponse;
import com.marketplace.catalog.api.v1.dto.response.ValidatedProductResponse;
import com.marketplace.catalog.application.service.ProductService;
import com.marketplace.catalog.domain.model.Category;
import com.marketplace.catalog.domain.model.Product;
import com.marketplace.catalog.domain.repository.ProductRepository;
import com.marketplace.catalog.infrastructure.client.InventoryGateway;
import com.marketplace.catalog.infrastructure.client.InventoryStockDto;
import com.marketplace.catalog.infrastructure.client.InventoryStockStatsDto;
import com.marketplace.catalog.infrastructure.messaging.ProductEventPublisher;
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
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductEventPublisher eventPublisher;

    @Mock
    private InventoryGateway inventoryGateway;

    @InjectMocks
    private ProductService productService;

    @Test
    void should_CreateProduct_Successfully() {
        CreateProductRequest request = new CreateProductRequest(
                "Test Product", "Description", BigDecimal.valueOf(99.99),
                100, Category.ELECTRONICS, "Acme", null, null
        );

        Product mockProduct = Product.create("seller-123", request.name(),
                request.description(), request.price(), request.stock(), request.category().name());

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
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Ürün bulunamadı");
    }

    @Test
    void should_ThrowException_When_UnauthorizedSeller() {
        Product mockProduct = Product.create("seller-123", "Product",
                "Desc", BigDecimal.valueOf(50), 10, "cat-001");

        when(productRepository.findById(any())).thenReturn(Optional.of(mockProduct));

        assertThatThrownBy(() -> productService.deleteProduct("product-id", "other-seller"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Bu ürüne erişim yetkiniz yok");
    }

    @Test
    void should_UseInventoryStock_When_Validating() {
        Product cached = Product.create("seller-1", "P", "d", BigDecimal.TEN, 99, "cat");
        cached.setId("p-1");
        when(productRepository.findByIdInAndActiveTrue(List.of("p-1"))).thenReturn(List.of(cached));
        when(inventoryGateway.getStockBatch(List.of("p-1")))
                .thenReturn(List.of(new InventoryStockDto("p-1", "seller-1", 3)));

        List<ValidatedProductResponse> results = productService.validateProducts(
                List.of(new ValidateProductRequest("p-1", 2)));

        assertThat(results).hasSize(1);
        assertThat(results.get(0).valid()).isTrue();
        assertThat(results.get(0).availableStock())
                .as("stock comes from inventory, not from cached Product.stock")
                .isEqualTo(3);
    }

    @Test
    void should_RejectValidate_When_InventoryStockBelowQuantity() {
        Product cached = Product.create("seller-1", "P", "d", BigDecimal.TEN, 99, "cat");
        cached.setId("p-1");
        when(productRepository.findByIdInAndActiveTrue(List.of("p-1"))).thenReturn(List.of(cached));
        when(inventoryGateway.getStockBatch(List.of("p-1")))
                .thenReturn(List.of(new InventoryStockDto("p-1", "seller-1", 1)));

        List<ValidatedProductResponse> results = productService.validateProducts(
                List.of(new ValidateProductRequest("p-1", 5)));

        assertThat(results.get(0).valid()).isFalse();
        assertThat(results.get(0).reason()).isEqualTo("Insufficient stock");
        assertThat(results.get(0).availableStock()).isEqualTo(1);
    }

    @Test
    void should_PreferInventoryStats_When_SellerStatsAvailable() {
        when(productRepository.countBySellerIdAndActiveTrue("s1")).thenReturn(20L);
        when(inventoryGateway.getSellerStats("s1", 20L))
                .thenReturn(Optional.of(new InventoryStockStatsDto(15, 5, 2)));

        SellerStatsResponse stats = productService.getSellerStats("s1");

        assertThat(stats.total()).isEqualTo(20);
        assertThat(stats.inStock()).isEqualTo(15);
        assertThat(stats.outOfStock()).isEqualTo(5);
        assertThat(stats.lowStock()).isEqualTo(2);
    }

    @Test
    void should_FallBackToCachedStock_When_InventoryStatsUnavailable() {
        when(productRepository.countBySellerIdAndActiveTrue("s1")).thenReturn(10L);
        when(inventoryGateway.getSellerStats("s1", 10L)).thenReturn(Optional.empty());
        when(productRepository.countBySellerIdAndActiveTrueAndStock("s1", 0)).thenReturn(2L);
        when(productRepository.countBySellerIdAndActiveTrueAndStockBetween("s1", 1, 9)).thenReturn(3L);

        SellerStatsResponse stats = productService.getSellerStats("s1");

        assertThat(stats.total()).isEqualTo(10);
        assertThat(stats.outOfStock()).isEqualTo(2);
        assertThat(stats.lowStock()).isEqualTo(3);
        assertThat(stats.inStock()).isEqualTo(8);
    }

    @Test
    void should_CallInventorySetStock_When_UpdateChangesStock() {
        Product existing = Product.create("seller-1", "P", "d", BigDecimal.TEN, 5, "cat");
        existing.setId("p-1");
        when(productRepository.findById("p-1")).thenReturn(Optional.of(existing));
        when(inventoryGateway.setStock("p-1", "seller-1", 50))
                .thenReturn(new InventoryStockDto("p-1", "seller-1", 50));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateProductRequest req = new UpdateProductRequest(
                null, null, null, 50, null, null, null, null);
        ProductResponse resp = productService.updateProduct("p-1", "seller-1", req);

        verify(inventoryGateway).setStock("p-1", "seller-1", 50);
        assertThat(resp.stock()).isEqualTo(50);
    }

    @Test
    void should_NotCallInventorySetStock_When_UpdateLeavesStockUnchanged() {
        Product existing = Product.create("seller-1", "P", "d", BigDecimal.TEN, 5, "cat");
        existing.setId("p-1");
        when(productRepository.findById("p-1")).thenReturn(Optional.of(existing));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateProductRequest req = new UpdateProductRequest(
                "renamed", null, null, null, null, null, null, null);
        productService.updateProduct("p-1", "seller-1", req);

        verify(inventoryGateway, never()).setStock(anyString(), anyString(), anyInt());
    }
}