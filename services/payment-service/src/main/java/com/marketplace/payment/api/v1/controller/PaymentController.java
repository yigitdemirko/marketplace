package com.marketplace.payment.api.v1.controller;

import com.marketplace.payment.api.v1.dto.request.ProcessPaymentRequest;
import com.marketplace.payment.api.v1.dto.response.PaymentResponse;
import com.marketplace.payment.application.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment processing via Iyzico sandbox")
@SecurityRequirement(name = "cookieAuth")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @Operation(
            summary = "Process payment",
            description = "Fetches the authoritative total from order-service, then charges the card via Iyzico. " +
                          "The amount field in the request body is ignored — only the server-side order total is used. " +
                          "Test card: 5528790000000008 / 12/2030 / CVC 123."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Payment processed (check status field — may be FAILED if card declined)"),
            @ApiResponse(responseCode = "400", description = "Order is not in a payable status or duplicate idempotency key"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "503", description = "Order-service or Iyzico unavailable — circuit breaker open")
    })
    public ResponseEntity<PaymentResponse> processPayment(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody ProcessPaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.processPayment(userId, request));
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get payment by order ID", description = "Retrieves payment details for a given order.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Payment found"),
            @ApiResponse(responseCode = "404", description = "No payment found for this order")
    })
    public ResponseEntity<PaymentResponse> getPaymentByOrderId(
            @PathVariable String orderId) {
        return ResponseEntity.ok(paymentService.getPaymentByOrderId(orderId));
    }
}
