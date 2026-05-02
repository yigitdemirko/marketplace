# order-service — Walkthrough

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
7. [Saga Akışı](#saga-akışı)

### Sorumluluk

Sipariş yaşam döngüsünü yönetir. Buyer'ın `POST /orders` çağrısını alır, fiyatları catalog'dan doğrular, sipariş durumlarını (PROCESSING → PAYMENT_PENDING → CONFIRMED → SHIPPED → DELIVERED veya CANCELLED) yönetir. Saga choreography'nin merkez koordinatörüdür ama saga'ya komut göndermez — sadece olayları okur ve kendi durumunu günceller.

### Bağımlılıklar

- **PostgreSQL** (`order_db`) — sipariş + outbox tablosu
- **Kafka** — publisher (`order.created`, `order.cancelled`) ve consumer (`stock.reserved`, `stock.reservation.failed`, `stock.reservation.expired`, `payment.completed`, `payment.failed`)
- **Feign → catalog-service** — fiyat doğrulama (`POST /products/validate`)
- **Eureka + Config Server** — discovery + konfigürasyon

### Veri Modeli

```
orders               — sipariş başlığı (id, userId, status, totalAmount, createdAt)
order_items          — sipariş kalemleri (productId, sellerId, quantity, unitPrice)
outbox_events        — atomik publish için outbox satırları
```

### Önemli Dosyalar

| Dosya | Sorumluluk |
|-------|-----------|
| `application/service/OrderService.java` | Use case'ler: `createOrder`, `confirmStock`, `confirmPayment`, `cancelOrderBySaga`, `markDelivered` |
| `application/scheduler/AutoDeliveryScheduler.java` | SHIPPED → DELIVERED 1 dakikada bir geçiş |
| `infrastructure/messaging/OrderEventPublisher.java` | Outbox satırı yazar (Kafka'ya direkt yazmaz) |
| `infrastructure/messaging/OutboxPublisher.java` | `@Scheduled` poller, outbox'tan Kafka'ya gönderir |
| `infrastructure/messaging/StockEventConsumer.java` | Saga olaylarını dinler, durum geçişi tetikler |
| `infrastructure/client/ProductValidationGateway.java` | Catalog Feign çağrısı + `@CircuitBreaker(name="catalog")` |
| `domain/model/Order.java` | Aggregate; `cancel()`, `confirmStock()`, `confirmPayment()` durum geçişleri |

### Önemli Patternler

- **Transactional Outbox** — `OrderEventPublisher` Kafka'ya direkt yazmaz, `outbox_events` tablosuna yazar. Sipariş + olay aynı DB transaction'ında commit edilir. `OutboxPublisher` 1 sn'de bir polling ile Kafka'ya gönderir. Kafka çökmüş olsa bile sipariş atomik olarak oluşur, olay sonradan yayınlanır.
- **Idempotent Order Creation** — `POST /orders` zorunlu `idempotencyKey` ister. Aynı key ile tekrar çağrı aynı orderId'yi döner, saga tekrar tetiklenmez.
- **Server-Authoritative Pricing** — Frontend'in gönderdiği fiyat ignore edilir. `OrderService.createOrder` `ProductValidationGateway.validate` çağırır, fiyatı catalog'dan alır. Fiyat tampering kapatılır.
- **Circuit Breaker** — `ProductValidationGateway` `@CircuitBreaker(name="catalog")` ile sarılı. Catalog down olduğunda fail-fast, fallback `ProductValidationUnavailableException` fırlatır.
- **Saga Compensation** — `cancelOrderBySaga(orderId, reason)` `stock.reservation.failed`, `stock.reservation.expired`, `payment.failed` olaylarına yanıt verir. CONFIRMED/SHIPPED/DELIVERED siparişler iptal edilemez (`Order.cancel()` throw eder).

### API

| Method | Path | Açıklama |
|--------|------|----------|
| `POST` | `/api/v1/orders` | Sipariş oluştur (idempotencyKey zorunlu) |
| `GET`  | `/api/v1/orders/{id}` | Sipariş detay (sadece owner) |
| `GET`  | `/api/v1/orders/me` | Kullanıcının siparişleri |
| `PATCH`| `/api/v1/orders/{id}/cancel` | Buyer iptali (PAYMENT_PENDING'e kadar) |
| `PATCH`| `/api/v1/orders/{id}/ship` | Seller kargoya verir |
| `PATCH`| `/api/v1/orders/{id}/deliver` | Seller teslim edildi işaretler |
| `GET`  | `/api/v1/orders/seller/stats` | Seller dashboard verileri |

### Saga Akışı

1. `POST /orders` → fiyat doğrula → DB'ye kaydet + outbox'a `order.created` yaz (tek tx) → 201 PROCESSING dön
2. `OutboxPublisher` `order.created` Kafka'ya iletir
3. `inventory-service` consume eder, atomik decrement yapar
4. Başarılı: `stock.reserved` → `confirmStock()` → status PAYMENT_PENDING
5. Başarısız: `stock.reservation.failed` → `cancelOrderBySaga()` → status CANCELLED
6. Buyer `POST /payments` çağırır, `payment-service` Iyzico'ya gider
7. `payment.completed` → `confirmPayment()` → status CONFIRMED
8. `payment.failed` → `cancelOrderBySaga()` → CANCELLED + inventory release
9. Seller `PATCH /ship` → SHIPPED
10. `AutoDeliveryScheduler` 1 dk sonra → DELIVERED

---

## English

### Table of Contents

1. [Responsibility](#responsibility)
2. [Dependencies](#dependencies)
3. [Data Model](#data-model)
4. [Key Files](#key-files)
5. [Key Patterns](#key-patterns)
6. [API](#api-1)
7. [Saga Flow](#saga-flow)

### Responsibility

Manages order lifecycle. Receives buyer's `POST /orders`, validates prices via catalog, manages order status (PROCESSING → PAYMENT_PENDING → CONFIRMED → SHIPPED → DELIVERED or CANCELLED). Acts as the saga choreography hub but does not command other services — only reacts to events and updates its own state.

### Dependencies

- **PostgreSQL** (`order_db`) — orders + outbox table
- **Kafka** — publisher (`order.created`, `order.cancelled`) and consumer (`stock.reserved`, `stock.reservation.failed`, `stock.reservation.expired`, `payment.completed`, `payment.failed`)
- **Feign → catalog-service** — price validation (`POST /products/validate`)
- **Eureka + Config Server** — discovery + configuration

### Data Model

```
orders               — order header (id, userId, status, totalAmount, createdAt)
order_items          — order lines (productId, sellerId, quantity, unitPrice)
outbox_events        — outbox rows for atomic publish
```

### Key Files

| File | Responsibility |
|------|---------------|
| `application/service/OrderService.java` | Use cases: `createOrder`, `confirmStock`, `confirmPayment`, `cancelOrderBySaga`, `markDelivered` |
| `application/scheduler/AutoDeliveryScheduler.java` | SHIPPED → DELIVERED transition every minute |
| `infrastructure/messaging/OrderEventPublisher.java` | Writes outbox row (does not write to Kafka directly) |
| `infrastructure/messaging/OutboxPublisher.java` | `@Scheduled` poller, sends outbox rows to Kafka |
| `infrastructure/messaging/StockEventConsumer.java` | Listens to saga events, triggers status transitions |
| `infrastructure/client/ProductValidationGateway.java` | Catalog Feign call + `@CircuitBreaker(name="catalog")` |
| `domain/model/Order.java` | Aggregate; `cancel()`, `confirmStock()`, `confirmPayment()` state transitions |

### Key Patterns

- **Transactional Outbox** — `OrderEventPublisher` does not write to Kafka directly; it writes to the `outbox_events` table. Order + event commit in the same DB transaction. `OutboxPublisher` polls every second and sends to Kafka. Even if Kafka is down, order creation is atomic and the event is published later.
- **Idempotent Order Creation** — `POST /orders` requires an `idempotencyKey`. Same key returns the same orderId, saga is not re-triggered.
- **Server-Authoritative Pricing** — Price sent by frontend is ignored. `OrderService.createOrder` calls `ProductValidationGateway.validate` and pulls price from catalog. Price tampering is prevented.
- **Circuit Breaker** — `ProductValidationGateway` is wrapped with `@CircuitBreaker(name="catalog")`. When catalog is down it fails fast; fallback throws `ProductValidationUnavailableException`.
- **Saga Compensation** — `cancelOrderBySaga(orderId, reason)` reacts to `stock.reservation.failed`, `stock.reservation.expired`, `payment.failed`. CONFIRMED/SHIPPED/DELIVERED orders cannot be cancelled (`Order.cancel()` throws).

### API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/orders` | Create order (idempotencyKey required) |
| `GET`  | `/api/v1/orders/{id}` | Order detail (owner only) |
| `GET`  | `/api/v1/orders/me` | User's orders |
| `PATCH`| `/api/v1/orders/{id}/cancel` | Buyer cancellation (until PAYMENT_PENDING) |
| `PATCH`| `/api/v1/orders/{id}/ship` | Seller marks shipped |
| `PATCH`| `/api/v1/orders/{id}/deliver` | Seller marks delivered |
| `GET`  | `/api/v1/orders/seller/stats` | Seller dashboard data |

### Saga Flow

1. `POST /orders` → validate price → save to DB + write `order.created` to outbox (single tx) → return 201 PROCESSING
2. `OutboxPublisher` forwards `order.created` to Kafka
3. `inventory-service` consumes, performs atomic decrement
4. Success: `stock.reserved` → `confirmStock()` → status PAYMENT_PENDING
5. Failure: `stock.reservation.failed` → `cancelOrderBySaga()` → status CANCELLED
6. Buyer calls `POST /payments`, `payment-service` calls Iyzico
7. `payment.completed` → `confirmPayment()` → status CONFIRMED
8. `payment.failed` → `cancelOrderBySaga()` → CANCELLED + inventory release
9. Seller `PATCH /ship` → SHIPPED
10. `AutoDeliveryScheduler` after 1 min → DELIVERED
