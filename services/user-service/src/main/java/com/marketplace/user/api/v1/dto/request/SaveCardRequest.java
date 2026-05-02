package com.marketplace.user.api.v1.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SaveCardRequest(
        @NotBlank String alias,
        @NotBlank String cardHolder,
        @NotBlank @Size(min = 4, max = 4) String last4,
        @NotBlank @Pattern(regexp = "0[1-9]|1[0-2]") String expireMonth,
        @NotBlank @Size(min = 4, max = 4) String expireYear
) {}
