package com.marketplace.order.api.v1.dto.response;

import java.math.BigDecimal;

public record SellerStatsResponse(long totalOrders, BigDecimal grossRevenue, long pendingShipment) {}
