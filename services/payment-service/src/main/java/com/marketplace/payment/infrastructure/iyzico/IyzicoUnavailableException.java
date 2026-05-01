package com.marketplace.payment.infrastructure.iyzico;

public class IyzicoUnavailableException extends RuntimeException {
    public IyzicoUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
