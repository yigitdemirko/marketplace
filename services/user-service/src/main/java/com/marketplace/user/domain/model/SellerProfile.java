package com.marketplace.user.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "seller_profiles")
@Getter
@Setter
public class SellerProfile {

    @Id
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String storeName;
    private String taxNumber;
    private String phone;

    @Column(nullable = false)
    private boolean approved = false;

    private LocalDateTime approvedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public static SellerProfile create(User user, String storeName, String taxNumber, String phone) {
        SellerProfile profile = new SellerProfile();
        profile.id = UUID.randomUUID().toString();
        profile.user = user;
        profile.storeName = storeName;
        profile.taxNumber = taxNumber;
        profile.phone = phone;
        return profile;
    }
}