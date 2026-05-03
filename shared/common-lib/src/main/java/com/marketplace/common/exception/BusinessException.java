package com.marketplace.common.exception;

/**
 * Base for all expected, mappable business errors. Carries the HTTP status and
 * a stable error code so the GlobalExceptionHandler can render a uniform
 * ErrorResponse without per-exception @ExceptionHandler methods.
 */
public abstract class BusinessException extends RuntimeException {

    private final int httpStatus;
    private final String code;

    protected BusinessException(int httpStatus, String code, String message) {
        super(message);
        this.httpStatus = httpStatus;
        this.code = code;
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    public String getCode() {
        return code;
    }
}
