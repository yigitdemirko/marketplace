package com.marketplace.catalog.infrastructure.client;

public class InventoryUnavailableException extends RuntimeException {
    public InventoryUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
