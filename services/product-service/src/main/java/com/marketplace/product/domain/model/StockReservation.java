package com.marketplace.product.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "stock_reservations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReservation {

    public enum Status { RESERVED, RELEASED }

    @Id
    private String orderId;

    private List<ReservedItem> items;
    private Status status;

    @CreatedDate
    private LocalDateTime createdAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReservedItem {
        private String productId;
        private int quantity;
    }
}
