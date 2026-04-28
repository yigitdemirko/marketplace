package com.marketplace.payment.infrastructure.iyzico;

import com.iyzipay.Options;
import com.iyzipay.model.*;
import com.iyzipay.request.CreatePaymentRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class IyzicoPaymentService {

    private final Options iyzicoOptions;

    public Payment processPayment(String orderId, String userId,
                                  BigDecimal amount, PaymentCard paymentCard) {
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setLocale(Locale.TR.getValue());
        request.setConversationId(orderId);
        request.setPrice(amount);
        request.setPaidPrice(amount);
        request.setCurrency(Currency.TRY.name());
        request.setInstallment(1);
        request.setBasketId(orderId);
        request.setPaymentChannel(PaymentChannel.WEB.name());
        request.setPaymentGroup(PaymentGroup.PRODUCT.name());

        request.setPaymentCard(paymentCard);

        Buyer buyer = new Buyer();
        buyer.setId(userId);
        buyer.setName("Test");
        buyer.setSurname("User");
        buyer.setEmail("test@test.com");
        buyer.setIdentityNumber("74300864791");
        buyer.setRegistrationAddress("Test Address");
        buyer.setCity("Istanbul");
        buyer.setCountry("Turkey");
        request.setBuyer(buyer);

        Address shippingAddress = new Address();
        shippingAddress.setContactName("Test User");
        shippingAddress.setCity("Istanbul");
        shippingAddress.setCountry("Turkey");
        shippingAddress.setAddress("Test Address");
        request.setShippingAddress(shippingAddress);
        request.setBillingAddress(shippingAddress);

        List<BasketItem> basketItems = new ArrayList<>();
        BasketItem item = new BasketItem();
        item.setId(orderId);
        item.setName("Order " + orderId);
        item.setCategory1("General");
        item.setItemType(BasketItemType.PHYSICAL.name());
        item.setPrice(amount);
        basketItems.add(item);
        request.setBasketItems(basketItems);

        Payment payment = Payment.create(request, iyzicoOptions);
        log.info("Iyzico payment result: status={}, conversationId={}",
                payment.getStatus(), payment.getConversationId());

        return payment;
    }
}