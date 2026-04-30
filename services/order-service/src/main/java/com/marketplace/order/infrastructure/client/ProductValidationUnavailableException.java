package com.marketplace.order.infrastructure.client;

public class ProductValidationUnavailableException extends RuntimeException {
    public ProductValidationUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
