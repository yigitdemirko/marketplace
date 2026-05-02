package com.marketplace.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Standard error response shape for every service.
 *
 * <p>Frontend gets one contract regardless of which service it talked to.
 * `details` is an optional bag for typed extra info (e.g. amount-limit values,
 * field-validation errors).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        String message,
        int status,
        String code,
        OffsetDateTime timestamp,
        Map<String, Object> details
) {
    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(message, status, null, OffsetDateTime.now(), null);
    }

    public static ErrorResponse of(int status, String code, String message) {
        return new ErrorResponse(message, status, code, OffsetDateTime.now(), null);
    }

    public static ErrorResponse of(int status, String code, String message, Map<String, Object> details) {
        return new ErrorResponse(message, status, code, OffsetDateTime.now(), details);
    }
}
