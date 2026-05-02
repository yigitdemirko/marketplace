package com.marketplace.basket.application.service;

public class BasketLimitExceededException extends RuntimeException {

    public BasketLimitExceededException(String message) {
        super(message);
    }
}
