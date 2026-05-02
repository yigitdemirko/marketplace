package com.marketplace.user.application.service;

import com.marketplace.user.api.v1.dto.request.SaveAddressRequest;
import com.marketplace.user.api.v1.dto.request.SaveCardRequest;
import com.marketplace.user.api.v1.dto.response.SavedAddressResponse;
import com.marketplace.user.api.v1.dto.response.SavedCardResponse;
import com.marketplace.user.domain.model.SavedAddress;
import com.marketplace.user.domain.model.SavedCard;
import com.marketplace.user.domain.repository.SavedAddressRepository;
import com.marketplace.user.domain.repository.SavedCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final SavedAddressRepository addressRepository;
    private final SavedCardRepository cardRepository;

    // ── Addresses ────────────────────────────────────────────────────────────

    public List<SavedAddressResponse> getAddresses(String userId) {
        return addressRepository.findAllByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream().map(SavedAddressResponse::from).toList();
    }

    @Transactional
    public SavedAddressResponse addAddress(String userId, SaveAddressRequest req) {
        SavedAddress address = SavedAddress.create(
                userId, req.title(), req.fullName(),
                req.city(), req.postalCode(),
                req.addressLine1(), req.addressLine2()
        );
        boolean hasNone = addressRepository.findAllByUserIdOrderByIsDefaultDescCreatedAtDesc(userId).isEmpty();
        address.setDefault(hasNone);
        return SavedAddressResponse.from(addressRepository.save(address));
    }

    @Transactional
    public void deleteAddress(String userId, String addressId) {
        SavedAddress address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        addressRepository.delete(address);
        if (address.isDefault()) {
            addressRepository.findAllByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                    .stream().findFirst().ifPresent(first -> {
                        first.setDefault(true);
                        addressRepository.save(first);
                    });
        }
    }

    @Transactional
    public SavedAddressResponse setDefaultAddress(String userId, String addressId) {
        addressRepository.clearDefaultForUser(userId);
        SavedAddress address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        address.setDefault(true);
        return SavedAddressResponse.from(addressRepository.save(address));
    }

    // ── Cards ─────────────────────────────────────────────────────────────────

    public List<SavedCardResponse> getCards(String userId) {
        return cardRepository.findAllByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream().map(SavedCardResponse::from).toList();
    }

    @Transactional
    public SavedCardResponse addCard(String userId, SaveCardRequest req) {
        SavedCard card = SavedCard.create(
                userId, req.alias(), req.cardHolder(),
                req.last4(), req.expireMonth(), req.expireYear()
        );
        boolean hasNone = cardRepository.findAllByUserIdOrderByIsDefaultDescCreatedAtDesc(userId).isEmpty();
        card.setDefault(hasNone);
        return SavedCardResponse.from(cardRepository.save(card));
    }

    @Transactional
    public void deleteCard(String userId, String cardId) {
        SavedCard card = cardRepository.findByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        cardRepository.delete(card);
        if (card.isDefault()) {
            cardRepository.findAllByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                    .stream().findFirst().ifPresent(first -> {
                        first.setDefault(true);
                        cardRepository.save(first);
                    });
        }
    }

    @Transactional
    public SavedCardResponse setDefaultCard(String userId, String cardId) {
        cardRepository.clearDefaultForUser(userId);
        SavedCard card = cardRepository.findByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        card.setDefault(true);
        return SavedCardResponse.from(cardRepository.save(card));
    }
}
