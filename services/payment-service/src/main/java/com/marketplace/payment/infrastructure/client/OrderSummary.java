package com.marketplace.payment.infrastructure.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OrderSummary(
        String id,
        String userId,
        String status,
        BigDecimal totalAmount
) {}
