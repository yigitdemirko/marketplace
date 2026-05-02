package com.marketplace.user.api.v1.dto.response;

import com.marketplace.user.domain.model.SavedCard;

public record SavedCardResponse(
        String id,
        String alias,
        String cardHolder,
        String last4,
        String expireMonth,
        String expireYear,
        boolean isDefault
) {
    public static SavedCardResponse from(SavedCard c) {
        return new SavedCardResponse(
                c.getId(), c.getAlias(), c.getCardHolder(),
                c.getLast4(), c.getExpireMonth(), c.getExpireYear(),
                c.isDefault()
        );
    }
}
