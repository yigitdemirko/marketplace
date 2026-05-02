package com.marketplace.user.api.v1.controller;

import com.marketplace.user.api.v1.dto.response.SellerPublicProfileResponse;
import com.marketplace.user.api.v1.dto.response.UserContactResponse;
import com.marketplace.user.domain.repository.SellerProfileRepository;
import com.marketplace.user.domain.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Public user profile lookups")
public class UserController {

    private final SellerProfileRepository sellerProfileRepository;
    private final UserRepository userRepository;

    @GetMapping("/seller/{userId}")
    @Operation(summary = "Get seller public profile", description = "Returns the store name for a given seller. No authentication required.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Seller profile found"),
            @ApiResponse(responseCode = "404", description = "Seller not found")
    })
    public ResponseEntity<SellerPublicProfileResponse> getSellerPublicProfile(@PathVariable String userId) {
        return sellerProfileRepository.findByUserId(userId)
                .map(p -> ResponseEntity.ok(new SellerPublicProfileResponse(p.getStoreName())))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{userId}/contact")
    @Operation(
            summary = "Get user contact info",
            description = "Internal endpoint used by notification-service to resolve email for event-driven notifications."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Contact info found"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<UserContactResponse> getUserContact(@PathVariable String userId) {
        return userRepository.findById(userId)
                .map(u -> ResponseEntity.ok(new UserContactResponse(u.getId(), u.getEmail())))
                .orElse(ResponseEntity.notFound().build());
    }
}
