package com.marketplace.inventory.api.v1.controller;

import com.marketplace.inventory.api.v1.dto.SellerStockStatsResponse;
import com.marketplace.inventory.api.v1.dto.SetStockRequest;
import com.marketplace.inventory.api.v1.dto.StockResponse;
import com.marketplace.inventory.application.service.InventoryQueryService;
import com.marketplace.inventory.application.service.StockService;
import com.marketplace.inventory.domain.model.ProductStock;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Stock truth — atomic reservations, releases, and per-product stock queries")
public class InventoryController {

    private final InventoryQueryService queryService;
    private final StockService stockService;

    @GetMapping("/{productId}")
    @Operation(summary = "Get stock for a product", description = "Returns current stock level. 404 if the product is unknown to inventory.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Stock found"),
            @ApiResponse(responseCode = "404", description = "Unknown productId")
    })
    public ResponseEntity<StockResponse> getStock(@PathVariable String productId) {
        return queryService.findByProductId(productId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/batch")
    @Operation(summary = "Batch get stock", description = "Returns stock for the given product ids. Used by catalog-service when validating an order.")
    public ResponseEntity<List<StockResponse>> getStockBatch(@RequestBody List<String> productIds) {
        return ResponseEntity.ok(queryService.findByProductIds(productIds));
    }

    @GetMapping("/seller/{sellerId}/stats")
    @Operation(
            summary = "Get seller stock stats",
            description = "Returns in-stock / out-of-stock / low-stock counts for a seller. Caller must pass totalActive (catalog's active product count) so we can derive in-stock without joining across services."
    )
    public ResponseEntity<SellerStockStatsResponse> getSellerStats(
            @PathVariable String sellerId,
            @RequestParam(defaultValue = "0") long totalActive) {
        return ResponseEntity.ok(queryService.getSellerStats(sellerId, totalActive));
    }

    @PutMapping("/{productId}/stock")
    @Operation(
            summary = "Set product stock",
            description = "Sets stock to an absolute value. Used by catalog when a seller edits stock via product PUT. Creates the entry if missing."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Stock set"),
            @ApiResponse(responseCode = "400", description = "Negative stock or missing sellerId")
    })
    public ResponseEntity<StockResponse> setStock(
            @PathVariable String productId,
            @Valid @RequestBody SetStockRequest body) {
        ProductStock saved = stockService.setStock(productId, body.sellerId(), body.stock());
        return ResponseEntity.ok(new StockResponse(saved.getProductId(), saved.getSellerId(), saved.getStock()));
    }
}
