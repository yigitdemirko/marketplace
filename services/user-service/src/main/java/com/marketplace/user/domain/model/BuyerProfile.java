package com.marketplace.user.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "buyer_profiles")
@Getter
@Setter
public class BuyerProfile {

    @Id
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String firstName;
    private String lastName;
    private String phone;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public static BuyerProfile create(User user, String firstName, String lastName) {
        BuyerProfile profile = new BuyerProfile();
        profile.id = UUID.randomUUID().toString();
        profile.user = user;
        profile.firstName = firstName;
        profile.lastName = lastName;
        return profile;
    }
}