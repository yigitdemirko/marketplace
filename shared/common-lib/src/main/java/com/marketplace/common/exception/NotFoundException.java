package com.marketplace.common.exception;

public class NotFoundException extends BusinessException {

    public NotFoundException(String message) {
        super(404, "NOT_FOUND", message);
    }

    public NotFoundException(String code, String message) {
        super(404, code, message);
    }
}
