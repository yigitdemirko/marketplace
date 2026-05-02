package com.marketplace.user.api.v1.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SaveAddressRequest(
        @NotBlank String title,
        @NotBlank String fullName,
        @NotBlank String city,
        @NotBlank String postalCode,
        @NotBlank String addressLine1,
        String addressLine2
) {}
