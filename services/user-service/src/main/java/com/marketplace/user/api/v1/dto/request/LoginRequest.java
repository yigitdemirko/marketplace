package com.marketplace.user.api.v1.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "E-posta zorunlu") @Email(message = "Geçerli bir e-posta girin") String email,
        @NotBlank(message = "Şifre zorunlu") String password
) {}
