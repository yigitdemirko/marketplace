package com.marketplace.user.api.v1.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SellerRegisterRequest(
        @NotBlank(message = "E-posta zorunlu") @Email(message = "Geçerli bir e-posta girin") String email,
        @NotBlank(message = "Şifre zorunlu") @Size(min = 6, message = "Şifre en az 6 karakter olmalı") String password,
        @NotBlank(message = "Mağaza adı zorunlu") String storeName,
        @NotBlank(message = "Vergi numarası zorunlu") String taxNumber,
        @NotBlank(message = "Telefon zorunlu") String phone
) {}
