package com.marketplace.order.unit;

import com.marketplace.common.exception.BadRequestException;
import com.marketplace.common.exception.ConflictException;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.common.exception.UnauthorizedException;
import com.marketplace.order.api.v1.dto.request.CreateOrderRequest;
import com.marketplace.order.api.v1.dto.request.OrderItemRequest;
import com.marketplace.order.api.v1.dto.response.OrderResponse;
import com.marketplace.order.application.service.OrderService;
import com.marketplace.order.domain.model.Order;
import com.marketplace.order.domain.model.OrderStatus;
import com.marketplace.order.domain.repository.OrderRepository;
import com.marketplace.order.infrastructure.client.ProductValidationGateway;
import com.marketplace.order.infrastructure.client.ValidatedProduct;
import com.marketplace.order.infrastructure.messaging.OrderEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderEventPublisher eventPublisher;

    @Mock
    private ProductValidationGateway productValidationGateway;

    @InjectMocks
    private OrderService orderService;

    @BeforeEach
    void setMaxAmount() {
        ReflectionTestUtils.setField(orderService, "maxAmount", new BigDecimal("100000"));
    }

    @Test
    void should_CreateOrder_Successfully() {
        CreateOrderRequest request = new CreateOrderRequest(
                List.of(new OrderItemRequest("prod-001", 2)),
                "Test Address",
                "idem-key-001"
        );

        when(orderRepository.findByIdempotencyKey(anyString())).thenReturn(Optional.empty());
        when(productValidationGateway.validate(any())).thenReturn(List.of(
                new ValidatedProduct("prod-001", true, "seller-123", BigDecimal.valueOf(99.99), 10, null)
        ));
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        OrderResponse response = orderService.createOrder("user-123", request);

        assertThat(response.userId()).isEqualTo("user-123");
        assertThat(response.status()).isEqualTo(OrderStatus.STOCK_RESERVING.name());
        assertThat(response.totalAmount()).isEqualByComparingTo(BigDecimal.valueOf(199.98));
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).sellerId()).isEqualTo("seller-123");
        assertThat(response.items().get(0).unitPrice()).isEqualByComparingTo(BigDecimal.valueOf(99.99));
        verify(eventPublisher).publishOrderCreated(any());
    }

    @Test
    void should_RejectOrder_When_ProductInvalid() {
        CreateOrderRequest request = new CreateOrderRequest(
                List.of(new OrderItemRequest("prod-001", 2)),
                "Test Address",
                "idem-key-001"
        );

        when(orderRepository.findByIdempotencyKey(anyString())).thenReturn(Optional.empty());
        when(productValidationGateway.validate(any())).thenReturn(List.of(
                new ValidatedProduct("prod-001", false, null, null, null, "Insufficient stock")
        ));

        assertThatThrownBy(() -> orderService.createOrder("user-123", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock");
        verify(eventPublisher, never()).publishOrderCreated(any());
    }

    @Test
    void should_ThrowException_When_IdempotencyKeyExists() {
        CreateOrderRequest request = new CreateOrderRequest(
                List.of(new OrderItemRequest("prod-001", 2)),
                "Test Address",
                "idem-key-001"
        );

        Order existing = Order.create("user-123", "Test Address", "idem-key-001");
        when(orderRepository.findByIdempotencyKey(anyString())).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> orderService.createOrder("user-123", request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Bu idempotency anahtarı ile zaten bir sipariş var");
    }

    @Test
    void should_ThrowException_When_OrderNotFound() {
        when(orderRepository.findById(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrder("non-existent", "user-123"))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Sipariş bulunamadı");
    }

    @Test
    void should_ThrowException_When_UnauthorizedUser() {
        Order order = Order.create("user-123", "Test Address", "idem-key-001");
        when(orderRepository.findById(anyString())).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.getOrder("order-id", "other-user"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Bu siparişe erişim yetkiniz yok");
    }

    @Test
    void should_CancelOrder_Successfully() {
        Order order = Order.create("user-123", "Test Address", "idem-key-001");
        order.setStatus(OrderStatus.STOCK_RESERVING);
        when(orderRepository.findById(anyString())).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        OrderResponse response = orderService.cancelOrder("order-id", "user-123");

        assertThat(response.status()).isEqualTo(OrderStatus.CANCELLED.name());
        verify(eventPublisher).publishOrderCancelled(any());
    }
}
