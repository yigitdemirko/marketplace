# payment-service — Walkthrough

**Diller / Languages:** [Türkçe](#türkçe) · [English](#english)

[← Tüm servisler / All services](./README.md) · [README.md](../../README.md)

---

## Türkçe

### İçindekiler

1. [Sorumluluk](#sorumluluk)
2. [Bağımlılıklar](#bağımlılıklar)
3. [Veri Modeli](#veri-modeli)
4. [Önemli Dosyalar](#önemli-dosyalar)
5. [Önemli Patternler](#önemli-patternler)
6. [API](#api)
7. [Ödeme Akışı](#ödeme-akışı)

### Sorumluluk

Iyzico üzerinden kart tahsilatı. Buyer `POST /payments` çağırır; servis order-service'ten authoritative tutarı çeker, Iyzico sandbox API'sine gider, sonucu Kafka olayı ile yayınlar (outbox üzerinden). Saga'nın "ödeme" adımı.

### Bağımlılıklar

- **PostgreSQL** (`payment_db`) — `payments`, `payment_outbox_events`
- **Kafka** — publisher (`payment.completed`, `payment.failed`); consumer yok (saga arka tarafa cevap verir)
- **Iyzico SDK** — sandbox üzerinde test kartlarıyla
- **Feign → order-service** — order'dan amount + ownership doğrulama

### Veri Modeli

```
payments               (id, orderId, userId, amount, status, iyzicoPaymentId,
                        failureReason, createdAt)
                       status: PENDING | COMPLETED | FAILED
payment_outbox_events  (id, eventType, aggregateId, payload, processed, createdAt)
```

### Önemli Dosyalar

| Dosya | Sorumluluk |
|-------|-----------|
| `application/service/PaymentService.java` | Iyzico'ya istek, status update, event publish |
| `infrastructure/client/OrderClient.java` | Feign interface, `X-User-Id` forward |
| `infrastructure/client/OrderServiceGateway.java` | `@CircuitBreaker(name="order")` |
| `infrastructure/client/IyzicoGateway.java` | `@CircuitBreaker(name="iyzico")` (30s open window) |
| `infrastructure/messaging/PaymentEventPublisher.java` | Outbox satırı yazar |
| `infrastructure/messaging/PaymentOutboxPublisher.java` | `@Scheduled` poller, outbox → Kafka |
| `domain/model/Payment.java` | Aggregate; status state machine |

### Önemli Patternler

- **Server-authoritative amount** — Frontend amount göndermez. `PaymentService.processPayment(userId, request)` `orderClient.getOrder(orderId)` çağırır, total'i order-service'ten alır. Amount tampering kapatılır.
- **Cross-user payment block** — Feign çağrısı `X-User-Id` header'ı geçirir; order-service `order.userId == requestUser` kontrolü yapar. Saldırgan başkasının order'ına ödeme yapamaz.
- **PAYABLE_STATUSES guard** — Payment yalnızca `PAYMENT_PENDING` veya `STOCK_RESERVING` durumdaki order'lar için kabul. Re-pay veya cancel-after-pay önlenir.
- **Transactional outbox** — Iyzico başarılı/başarısız → status update + outbox satırı aynı tx'te commit. Kafka çökmüş olsa bile event sonradan yayınlanır.
- **Circuit breaker × 2** — `order` (10s open) ve `iyzico` (30s open — dış sağlayıcı, daha tolerans). `OrderServiceUnavailableException` ve `IyzicoUnavailableException` 503 dönecek şekilde GlobalExceptionHandler'da map'lenir.
- **Idempotent payment** — Payment ID benzersiz; aynı orderId'ye iki ödeme `PAYABLE_STATUSES` guard'ı tarafından engellenir.

### API

| Method | Path | Açıklama |
|--------|------|----------|
| `POST` | `/api/v1/payments` | Ödeme işle (orderId + card details) |
| `GET`  | `/api/v1/payments/{paymentId}` | Ödeme detay |

### Ödeme Akışı

1. Buyer `POST /payments` (orderId + card) → gateway `X-User-Id` header'ı ekler
2. `PaymentService.processPayment(userId, req)` → `orderServiceGateway.getOrder(orderId)` → amount + ownership
3. Order PAYABLE değil mi? → 4xx, çık
4. Iyzico'ya `iyzicoGateway.charge()` çağrısı (CB sarılı)
5. Başarılı → `Payment.complete()` → `payment_outbox_events`'e `payment.completed` ekle (aynı tx)
6. Başarısız → `Payment.fail(reason)` → `payment.failed` ekle
7. `PaymentOutboxPublisher` 1 sn'de bir Kafka'ya iletir
8. order-service consume eder → CONFIRMED veya CANCELLED
9. CANCELLED durumunda inventory `order.cancelled`'ı consume edip stok release eder

---

## English

### Table of Contents

1. [Responsibility](#responsibility)
2. [Dependencies](#dependencies)
3. [Data Model](#data-model)
4. [Key Files](#key-files)
5. [Key Patterns](#key-patterns)
6. [API](#api-1)
7. [Payment Flow](#payment-flow)

### Responsibility

Card payments via Iyzico. The buyer calls `POST /payments`; the service pulls the authoritative amount from order-service, calls Iyzico sandbox, and publishes the result as a Kafka event (via outbox). The "payment" step in the saga.

### Dependencies

- **PostgreSQL** (`payment_db`) — `payments`, `payment_outbox_events`
- **Kafka** — publisher (`payment.completed`, `payment.failed`); no consumer (saga responds upstream)
- **Iyzico SDK** — sandbox with test cards
- **Feign → order-service** — fetch amount + ownership check

### Data Model

```
payments               (id, orderId, userId, amount, status, iyzicoPaymentId,
                        failureReason, createdAt)
                       status: PENDING | COMPLETED | FAILED
payment_outbox_events  (id, eventType, aggregateId, payload, processed, createdAt)
```

### Key Files

| File | Responsibility |
|------|---------------|
| `application/service/PaymentService.java` | Iyzico call, status update, event publish |
| `infrastructure/client/OrderClient.java` | Feign interface, forwards `X-User-Id` |
| `infrastructure/client/OrderServiceGateway.java` | `@CircuitBreaker(name="order")` |
| `infrastructure/client/IyzicoGateway.java` | `@CircuitBreaker(name="iyzico")` (30s open window) |
| `infrastructure/messaging/PaymentEventPublisher.java` | Writes outbox row |
| `infrastructure/messaging/PaymentOutboxPublisher.java` | `@Scheduled` poller, outbox → Kafka |
| `domain/model/Payment.java` | Aggregate; status state machine |

### Key Patterns

- **Server-authoritative amount** — Frontend doesn't send amount. `PaymentService.processPayment(userId, request)` calls `orderClient.getOrder(orderId)` to fetch total. Amount tampering closed.
- **Cross-user payment block** — Feign call forwards `X-User-Id` header; order-service checks `order.userId == requestUser`. Attacker can't pay for someone else's order.
- **PAYABLE_STATUSES guard** — Payment only accepted for orders in `PAYMENT_PENDING` or `STOCK_RESERVING`. Re-pay and cancel-after-pay prevented.
- **Transactional outbox** — Iyzico success/failure → status update + outbox row commit in same tx. Even if Kafka is down, the event eventually publishes.
- **Circuit breaker × 2** — `order` (10s open) and `iyzico` (30s open — external provider, more tolerant). `OrderServiceUnavailableException` and `IyzicoUnavailableException` mapped to 503 in GlobalExceptionHandler.
- **Idempotent payment** — Payment ID is unique; double-payment for same orderId blocked by PAYABLE_STATUSES guard.

### API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/payments` | Process payment (orderId + card details) |
| `GET`  | `/api/v1/payments/{paymentId}` | Payment detail |

### Payment Flow

1. Buyer `POST /payments` (orderId + card) → gateway adds `X-User-Id` header
2. `PaymentService.processPayment(userId, req)` → `orderServiceGateway.getOrder(orderId)` → amount + ownership
3. Order not PAYABLE? → 4xx, exit
4. Call Iyzico `iyzicoGateway.charge()` (CB-wrapped)
5. Success → `Payment.complete()` → insert `payment.completed` into `payment_outbox_events` (same tx)
6. Failure → `Payment.fail(reason)` → insert `payment.failed`
7. `PaymentOutboxPublisher` polls every second → forwards to Kafka
8. order-service consumes → CONFIRMED or CANCELLED
9. On CANCELLED, inventory consumes `order.cancelled` and releases stock
