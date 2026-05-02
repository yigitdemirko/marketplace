package com.marketplace.user.unit;

import com.marketplace.user.api.v1.dto.request.SaveAddressRequest;
import com.marketplace.user.api.v1.dto.request.SaveCardRequest;
import com.marketplace.user.api.v1.dto.response.SavedAddressResponse;
import com.marketplace.user.api.v1.dto.response.SavedCardResponse;
import com.marketplace.user.application.service.ProfileService;
import com.marketplace.user.domain.model.SavedAddress;
import com.marketplace.user.domain.model.SavedCard;
import com.marketplace.user.domain.repository.SavedAddressRepository;
import com.marketplace.user.domain.repository.SavedCardRepository;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private SavedAddressRepository addressRepository;

    @Mock
    private SavedCardRepository cardRepository;

    @InjectMocks
    private ProfileService profileService;

    private SaveAddressRequest sampleAddressReq() {
        return new SaveAddressRequest("Home", "Ahmet Yılmaz", "Istanbul", "34000",
                "Bagdat Cad. 123", "Daire 5");
    }

    private SaveCardRequest sampleCardReq() {
        return new SaveCardRequest("My Card", "AHMET YILMAZ", "0008", "12", "2030");
    }

    // ── Address: add ───────────────────────────────────────────────────────────

    @Test
    void should_MarkFirstAddressAsDefault_When_UserHasNoAddresses() {
        when(addressRepository.findAllByUserIdOrderByIsDefaultDescCreatedAtDesc("u1"))
                .thenReturn(List.of());
        when(addressRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        SavedAddressResponse result = profileService.addAddress("u1", sampleAddressReq());

        assertThat(result.isDefault()).isTrue();
    }

    @Test
    void should_NotMarkAsDefault_When_UserAlreadyHasAddresses() {
        when(addressRepository.findAllByUserIdOrderByIsDefaultDescCreatedAtDesc("u1"))
                .thenReturn(List.of(SavedAddress.create("u1", "Old", "X", "X", "X", "X", null)));
        when(addressRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        SavedAddressResponse result = profileService.addAddress("u1", sampleAddressReq());

        assertThat(result.isDefault()).isFalse();
    }

    // ── Address: delete + cascade ──────────────────────────────────────────────

    @Test
    void should_PromoteNextAddressToDefault_When_DefaultIsDeleted() {
        SavedAddress deleted = SavedAddress.create("u1", "Home", "X", "X", "X", "X", null);
        deleted.setDefault(true);
        SavedAddress remaining = SavedAddress.create("u1", "Office", "X", "X", "X", "X", null);

        when(addressRepository.findByIdAndUserId(deleted.getId(), "u1"))
                .thenReturn(Optional.of(deleted));
        when(addressRepository.findAllByUserIdOrderByIsDefaultDescCreatedAtDesc("u1"))
                .thenReturn(List.of(remaining));

        profileService.deleteAddress("u1", deleted.getId());

        verify(addressRepository).delete(deleted);
        ArgumentCaptor<SavedAddress> captor = ArgumentCaptor.forClass(SavedAddress.class);
        verify(addressRepository).save(captor.capture());
        assertThat(captor.getValue().isDefault()).isTrue();
        assertThat(captor.getValue().getId()).isEqualTo(remaining.getId());
    }

    @Test
    void should_NotPromoteAnyone_When_NonDefaultAddressDeleted() {
        SavedAddress deleted = SavedAddress.create("u1", "Office", "X", "X", "X", "X", null);
        deleted.setDefault(false);

        when(addressRepository.findByIdAndUserId(deleted.getId(), "u1"))
                .thenReturn(Optional.of(deleted));

        profileService.deleteAddress("u1", deleted.getId());

        verify(addressRepository).delete(deleted);
        verify(addressRepository, never()).save(any());
    }

    @Test
    void should_Throw404_When_DeletingAddressFromAnotherUser() {
        when(addressRepository.findByIdAndUserId(any(), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.deleteAddress("attacker", "addr-1"))
                .isInstanceOf(ResponseStatusException.class);

        verify(addressRepository, never()).delete(any());
    }

    // ── Address: setDefault ────────────────────────────────────────────────────

    @Test
    void should_ClearOtherDefaultsBeforeSetting() {
        SavedAddress target = SavedAddress.create("u1", "Office", "X", "X", "X", "X", null);
        when(addressRepository.findByIdAndUserId(target.getId(), "u1"))
                .thenReturn(Optional.of(target));
        when(addressRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        SavedAddressResponse result = profileService.setDefaultAddress("u1", target.getId());

        verify(addressRepository).clearDefaultForUser("u1");
        assertThat(result.isDefault()).isTrue();
    }

    @Test
    void should_Throw404_When_SettingDefaultOnUnknownAddress() {
        when(addressRepository.findByIdAndUserId(any(), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.setDefaultAddress("u1", "ghost"))
                .isInstanceOf(ResponseStatusException.class);
    }

    // ── Cards: same shape, fewer cases ─────────────────────────────────────────

    @Test
    void should_MarkFirstCardAsDefault_When_UserHasNoCards() {
        when(cardRepository.findAllByUserIdOrderByIsDefaultDescCreatedAtDesc("u1"))
                .thenReturn(List.of());
        when(cardRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        SavedCardResponse result = profileService.addCard("u1", sampleCardReq());

        assertThat(result.isDefault()).isTrue();
    }

    @Test
    void should_PromoteNextCardToDefault_When_DefaultCardDeleted() {
        SavedCard deleted = SavedCard.create("u1", "Old", "X", "0008", "12", "2030");
        deleted.setDefault(true);
        SavedCard remaining = SavedCard.create("u1", "New", "X", "0009", "11", "2029");

        when(cardRepository.findByIdAndUserId(deleted.getId(), "u1"))
                .thenReturn(Optional.of(deleted));
        when(cardRepository.findAllByUserIdOrderByIsDefaultDescCreatedAtDesc("u1"))
                .thenReturn(List.of(remaining));

        profileService.deleteCard("u1", deleted.getId());

        ArgumentCaptor<SavedCard> captor = ArgumentCaptor.forClass(SavedCard.class);
        verify(cardRepository).save(captor.capture());
        assertThat(captor.getValue().isDefault()).isTrue();
        assertThat(captor.getValue().getId()).isEqualTo(remaining.getId());
    }

    @Test
    void should_Throw404_When_DeletingCardFromAnotherUser() {
        when(cardRepository.findByIdAndUserId(any(), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.deleteCard("attacker", "card-1"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void should_ClearOtherDefaultCards_BeforeSettingDefault() {
        SavedCard target = SavedCard.create("u1", "Card", "X", "0008", "12", "2030");
        when(cardRepository.findByIdAndUserId(target.getId(), "u1"))
                .thenReturn(Optional.of(target));
        when(cardRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        profileService.setDefaultCard("u1", target.getId());

        verify(cardRepository).clearDefaultForUser("u1");
    }

    // ── Read paths ─────────────────────────────────────────────────────────────

    @Test
    void should_ReturnAddresses_OrderedByDefaultAndCreatedAt() {
        SavedAddress a = SavedAddress.create("u1", "A", "X", "X", "X", "X", null);
        SavedAddress b = SavedAddress.create("u1", "B", "X", "X", "X", "X", null);
        when(addressRepository.findAllByUserIdOrderByIsDefaultDescCreatedAtDesc("u1"))
                .thenReturn(List.of(a, b));

        List<SavedAddressResponse> result = profileService.getAddresses("u1");

        assertThat(result).hasSize(2);
        verify(addressRepository).findAllByUserIdOrderByIsDefaultDescCreatedAtDesc(eq("u1"));
    }

    @Test
    void should_ReturnCards_OrderedByDefaultAndCreatedAt() {
        SavedCard a = SavedCard.create("u1", "A", "X", "0008", "12", "2030");
        when(cardRepository.findAllByUserIdOrderByIsDefaultDescCreatedAtDesc("u1"))
                .thenReturn(List.of(a));

        List<SavedCardResponse> result = profileService.getCards("u1");

        assertThat(result).hasSize(1);
    }
}
