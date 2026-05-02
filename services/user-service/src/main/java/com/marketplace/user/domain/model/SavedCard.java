package com.marketplace.user.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "saved_cards")
@Getter
@Setter
public class SavedCard {

    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false)
    private String alias;

    @Column(name = "card_holder", nullable = false)
    private String cardHolder;

    @Column(nullable = false, length = 4)
    private String last4;

    @Column(name = "expire_month", nullable = false, length = 2)
    private String expireMonth;

    @Column(name = "expire_year", nullable = false)
    private String expireYear;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public static SavedCard create(String userId, String alias, String cardHolder,
                                   String last4, String expireMonth, String expireYear) {
        SavedCard c = new SavedCard();
        c.id = UUID.randomUUID().toString();
        c.userId = userId;
        c.alias = alias;
        c.cardHolder = cardHolder;
        c.last4 = last4;
        c.expireMonth = expireMonth;
        c.expireYear = expireYear;
        c.isDefault = false;
        return c;
    }
}
