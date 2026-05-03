package com.marketplace.user.domain.exception;

import com.marketplace.common.exception.UnauthorizedException;

/**
 * Thrown when login credentials are invalid (wrong email, wrong password, or wrong account
 * type). Always maps to 401 with code AUTH_INVALID_CREDENTIALS — kept generic to prevent
 * user enumeration.
 */
public class AuthenticationException extends UnauthorizedException {
    public AuthenticationException(String message) {
        super("AUTH_INVALID_CREDENTIALS", message);
    }
}
