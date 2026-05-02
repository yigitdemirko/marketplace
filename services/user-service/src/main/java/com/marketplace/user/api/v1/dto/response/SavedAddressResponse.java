package com.marketplace.user.api.v1.dto.response;

import com.marketplace.user.domain.model.SavedAddress;

public record SavedAddressResponse(
        String id,
        String title,
        String fullName,
        String city,
        String postalCode,
        String addressLine1,
        String addressLine2,
        boolean isDefault
) {
    public static SavedAddressResponse from(SavedAddress a) {
        return new SavedAddressResponse(
                a.getId(), a.getTitle(), a.getFullName(),
                a.getCity(), a.getPostalCode(),
                a.getAddressLine1(), a.getAddressLine2(),
                a.isDefault()
        );
    }
}
