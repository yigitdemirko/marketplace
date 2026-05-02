package com.marketplace.user.api.v1.controller;

import com.marketplace.user.api.v1.dto.request.SaveAddressRequest;
import com.marketplace.user.api.v1.dto.request.SaveCardRequest;
import com.marketplace.user.api.v1.dto.response.SavedAddressResponse;
import com.marketplace.user.api.v1.dto.response.SavedCardResponse;
import com.marketplace.user.application.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "Saved addresses and cards for the authenticated buyer")
@SecurityRequirement(name = "cookieAuth")
public class ProfileController {

    private final ProfileService profileService;

    // ── Addresses ────────────────────────────────────────────────────────────

    @GetMapping("/addresses")
    @Operation(summary = "List saved addresses")
    public ResponseEntity<List<SavedAddressResponse>> getAddresses(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(profileService.getAddresses(userId));
    }

    @PostMapping("/addresses")
    @Operation(summary = "Save a new address")
    public ResponseEntity<SavedAddressResponse> addAddress(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody SaveAddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(profileService.addAddress(userId, request));
    }

    @DeleteMapping("/addresses/{addressId}")
    @Operation(summary = "Delete a saved address")
    public ResponseEntity<Void> deleteAddress(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String addressId) {
        profileService.deleteAddress(userId, addressId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/addresses/{addressId}/default")
    @Operation(summary = "Set address as default")
    public ResponseEntity<SavedAddressResponse> setDefaultAddress(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String addressId) {
        return ResponseEntity.ok(profileService.setDefaultAddress(userId, addressId));
    }

    // ── Cards ─────────────────────────────────────────────────────────────────

    @GetMapping("/cards")
    @Operation(summary = "List saved cards")
    public ResponseEntity<List<SavedCardResponse>> getCards(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(profileService.getCards(userId));
    }

    @PostMapping("/cards")
    @Operation(summary = "Save a new card (metadata only — no full card number stored)")
    public ResponseEntity<SavedCardResponse> addCard(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody SaveCardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(profileService.addCard(userId, request));
    }

    @DeleteMapping("/cards/{cardId}")
    @Operation(summary = "Delete a saved card")
    public ResponseEntity<Void> deleteCard(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String cardId) {
        profileService.deleteCard(userId, cardId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/cards/{cardId}/default")
    @Operation(summary = "Set card as default")
    public ResponseEntity<SavedCardResponse> setDefaultCard(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String cardId) {
        return ResponseEntity.ok(profileService.setDefaultCard(userId, cardId));
    }
}
