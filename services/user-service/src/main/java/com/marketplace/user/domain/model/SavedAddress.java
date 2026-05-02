package com.marketplace.user.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "saved_addresses")
@Getter
@Setter
public class SavedAddress {

    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false)
    private String title;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String city;

    @Column(name = "postal_code", nullable = false)
    private String postalCode;

    @Column(name = "address_line1", nullable = false)
    private String addressLine1;

    @Column(name = "address_line2")
    private String addressLine2;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public static SavedAddress create(String userId, String title, String fullName,
                                      String city, String postalCode,
                                      String addressLine1, String addressLine2) {
        SavedAddress a = new SavedAddress();
        a.id = UUID.randomUUID().toString();
        a.userId = userId;
        a.title = title;
        a.fullName = fullName;
        a.city = city;
        a.postalCode = postalCode;
        a.addressLine1 = addressLine1;
        a.addressLine2 = addressLine2;
        a.isDefault = false;
        return a;
    }
}
