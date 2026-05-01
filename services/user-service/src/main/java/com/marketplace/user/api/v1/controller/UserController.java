package com.marketplace.user.api.v1.controller;

import com.marketplace.user.api.v1.dto.response.SellerPublicProfileResponse;
import com.marketplace.user.api.v1.dto.response.UserContactResponse;
import com.marketplace.user.domain.repository.SellerProfileRepository;
import com.marketplace.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final SellerProfileRepository sellerProfileRepository;
    private final UserRepository userRepository;

    @GetMapping("/seller/{userId}")
    public ResponseEntity<SellerPublicProfileResponse> getSellerPublicProfile(@PathVariable String userId) {
        return sellerProfileRepository.findByUserId(userId)
                .map(p -> ResponseEntity.ok(new SellerPublicProfileResponse(p.getStoreName())))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{userId}/contact")
    public ResponseEntity<UserContactResponse> getUserContact(@PathVariable String userId) {
        return userRepository.findById(userId)
                .map(u -> ResponseEntity.ok(new UserContactResponse(u.getId(), u.getEmail())))
                .orElse(ResponseEntity.notFound().build());
    }
}
