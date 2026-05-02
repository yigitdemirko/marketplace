package com.marketplace.inventory.unit;

import com.marketplace.inventory.api.v1.dto.SellerStockStatsResponse;
import com.marketplace.inventory.api.v1.dto.StockResponse;
import com.marketplace.inventory.application.service.InventoryQueryService;
import com.marketplace.inventory.domain.model.ProductStock;
import com.marketplace.inventory.domain.repository.ProductStockRepository;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class InventoryQueryServiceTest {

    @Mock
    private ProductStockRepository repository;

    @InjectMocks
    private InventoryQueryService queryService;

    @Test
    void should_ReturnStock_WhenProductExists() {
        when(repository.findById("p-1")).thenReturn(Optional.of(stock("p-1", "seller-1", 7)));

        Optional<StockResponse> result = queryService.findByProductId("p-1");

        assertThat(result).isPresent();
        assertThat(result.get().productId()).isEqualTo("p-1");
        assertThat(result.get().stock()).isEqualTo(7);
    }

    @Test
    void should_ReturnEmpty_WhenProductMissing() {
        when(repository.findById("missing")).thenReturn(Optional.empty());

        assertThat(queryService.findByProductId("missing")).isEmpty();
    }

    @Test
    void should_DeriveSellerStats_FromCountsAndCallerProvidedTotal() {
        when(repository.countBySellerIdAndStock("seller-1", 0)).thenReturn(2L);
        when(repository.countBySellerIdAndStockBetween("seller-1", 1, 9)).thenReturn(3L);

        SellerStockStatsResponse stats = queryService.getSellerStats("seller-1", 10);

        assertThat(stats.outOfStock()).isEqualTo(2);
        assertThat(stats.lowStock()).isEqualTo(3);
        assertThat(stats.inStock()).isEqualTo(8);
    }

    @Test
    void should_NotReportNegativeInStock_WhenTotalLagsBehindCounts() {
        when(repository.countBySellerIdAndStock("seller-1", 0)).thenReturn(5L);
        when(repository.countBySellerIdAndStockBetween("seller-1", 1, 9)).thenReturn(0L);

        SellerStockStatsResponse stats = queryService.getSellerStats("seller-1", 3);

        assertThat(stats.inStock()).isZero();
    }

    @Test
    void should_BatchLookupStockByIds() {
        when(repository.findByProductIdIn(List.of("p-1", "p-2"))).thenReturn(List.of(
                stock("p-1", "seller-1", 1),
                stock("p-2", "seller-2", 0)
        ));

        List<StockResponse> result = queryService.findByProductIds(List.of("p-1", "p-2"));

        assertThat(result).extracting(StockResponse::productId).containsExactly("p-1", "p-2");
    }

    private ProductStock stock(String productId, String sellerId, int qty) {
        return ProductStock.builder().productId(productId).sellerId(sellerId).stock(qty).build();
    }
}
