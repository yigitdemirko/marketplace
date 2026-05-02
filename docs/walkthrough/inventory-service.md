# inventory-service — Walkthrough

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
7. [Saga Participant Akışı](#saga-participant-akışı)

### Sorumluluk

Stok bilgisinin tek doğru kaynağı (source of truth). Sipariş geldiğinde atomik olarak stoğu azaltır, ödeme başarısız olursa serbest bırakır. Order-saga'nın participant'ı. Catalog-service buradan Feign+CB ile okur. Kafka olayları ile sistemin geri kalanını bilgilendirir.

### Bağımlılıklar

- **MongoDB** (`inventory_db`) — `product_stock`, `stock_reservations` koleksiyonları
- **Kafka** — publisher (`stock.reserved`, `stock.reservation.failed`, `stock.reservation.expired`, `stock.changed`); consumer (`order.created`, `order.cancelled`, `product.created`, `product.deleted`)

### Veri Modeli

```
product_stock         (productId, sellerId, stock)
stock_reservations    (orderId, items[{productId, quantity}], status, createdAt, expiresAt)
                      status: RESERVED | RELEASED
```

### Önemli Dosyalar

| Dosya | Sorumluluk |
|-------|-----------|
| `application/service/StockService.java` | `reserve`, `release`, `setStock` — atomic decrement core'u |
| `application/service/InventoryQueryService.java` | Catalog'un Feign için query side |
| `application/scheduler/ReservationCleanupScheduler.java` | TTL'i geçen RESERVED'leri serbest bırak, `stock.reservation.expired` yayınla |
| `infrastructure/messaging/OrderEventConsumer.java` | `order.created` → reserve → `stock.reserved`/`failed`; `order.cancelled` → release |
| `infrastructure/messaging/ProductLifecycleConsumer.java` | `product.created/deleted` → ProductStock doc oluştur/sil |
| `infrastructure/messaging/InventoryEventPublisher.java` | `stock.changed`, `stock.reservation.expired` |
| `infrastructure/bootstrap/InventoryBootstrap.java` | İlk boot'ta product_db'den stok kopyalama (tek seferlik) |

### Önemli Patternler

- **Atomik conditional decrement** — `MongoTemplate.findAndModify(Query.where(_id=p, stock>=qty), Update.inc("stock", -qty))`. Race-free; aynı anda gelen 20 talepten yalnızca yeterli stok kadar başarılı olur.
- **Idempotent reservation** — `stock_reservations._id = orderId`. Aynı `order.created` event'i tekrar gelirse `findById(orderId).isPresent()` → no-op.
- **Idempotent release** — `release()` `RELEASED` durumdaysa no-op; çift `order.cancelled` güvenli.
- **Multi-item rollback** — Sepetteki bir item'da stok yetmezse, daha önce decrement edilen item'lar geri yüklenir, reservation kaydedilmez.
- **TTL cleanup** — Her reservation `expiresAt = createdAt + 15dk` ile yaratılır. `ReservationCleanupScheduler` 60 sn'de bir polling: süresi geçmiş RESERVED'leri release eder + `stock.reservation.expired` yayınlar → order-service consume eder ve siparişi iptal eder.
- **Boot-time copy** — Inventory ayrı servis olarak split edilirken catalog'un MongoDB'sinden ürünleri tek seferlik kopyalama; flag ile kontrol edilir.

### API

| Method | Path | Açıklama |
|--------|------|----------|
| `GET`  | `/api/v1/inventory/{productId}` | Tek ürün stok |
| `POST` | `/api/v1/inventory/batch` | Çoklu ürün stoğu (catalog Feign için) |
| `GET`  | `/api/v1/inventory/seller/{userId}/stats` | Total/in-stock/out-of-stock/low-stock count |
| `PUT`  | `/api/v1/inventory/{productId}/stock` | Setpoint (manuel stok set) |

### Saga Participant Akışı

1. `order.created` consume → `stockService.reserve(orderId, items)`
2. Her item için atomic decrement
3. Hepsi başarılı → reservation kaydet → `stock.reserved` yayınla
4. Bir item yetersiz → önceki decrement'leri rollback → reservation kaydetmeden `stock.reservation.failed` yayınla
5. Her decrement/increment sonrası `stock.changed` yayınla (catalog + search senkronizasyonu)
6. `order.cancelled` gelirse `release()` → stoklar geri → `stock.changed` yayınla
7. Reservation TTL geçerse scheduler `release()` çağırır + `stock.reservation.expired` yayınlar

---

## English

### Table of Contents

1. [Responsibility](#responsibility)
2. [Dependencies](#dependencies)
3. [Data Model](#data-model)
4. [Key Files](#key-files)
5. [Key Patterns](#key-patterns)
6. [API](#api-1)
7. [Saga Participant Flow](#saga-participant-flow)

### Responsibility

Single source of truth for stock. When an order arrives, atomically decrements stock; if payment fails, releases it. Saga participant for the order saga. catalog-service reads from here via Feign+CB. Notifies the rest of the system via Kafka events.

### Dependencies

- **MongoDB** (`inventory_db`) — `product_stock`, `stock_reservations` collections
- **Kafka** — publisher (`stock.reserved`, `stock.reservation.failed`, `stock.reservation.expired`, `stock.changed`); consumer (`order.created`, `order.cancelled`, `product.created`, `product.deleted`)

### Data Model

```
product_stock         (productId, sellerId, stock)
stock_reservations    (orderId, items[{productId, quantity}], status, createdAt, expiresAt)
                      status: RESERVED | RELEASED
```

### Key Files

| File | Responsibility |
|------|---------------|
| `application/service/StockService.java` | `reserve`, `release`, `setStock` — atomic decrement core |
| `application/service/InventoryQueryService.java` | Query side for catalog's Feign calls |
| `application/scheduler/ReservationCleanupScheduler.java` | Release expired RESERVED reservations, publish `stock.reservation.expired` |
| `infrastructure/messaging/OrderEventConsumer.java` | `order.created` → reserve → `stock.reserved`/`failed`; `order.cancelled` → release |
| `infrastructure/messaging/ProductLifecycleConsumer.java` | `product.created/deleted` → create/delete ProductStock doc |
| `infrastructure/messaging/InventoryEventPublisher.java` | `stock.changed`, `stock.reservation.expired` |
| `infrastructure/bootstrap/InventoryBootstrap.java` | One-shot copy from product_db at first boot |

### Key Patterns

- **Atomic conditional decrement** — `MongoTemplate.findAndModify(Query.where(_id=p, stock>=qty), Update.inc("stock", -qty))`. Race-free; out of 20 concurrent requests, only as many as available stock succeed.
- **Idempotent reservation** — `stock_reservations._id = orderId`. If `order.created` is delivered twice, `findById(orderId).isPresent()` → no-op.
- **Idempotent release** — `release()` is a no-op if already `RELEASED`; double `order.cancelled` is safe.
- **Multi-item rollback** — If one cart item fails on stock, previously decremented items are rolled back and the reservation is not saved.
- **TTL cleanup** — Each reservation is created with `expiresAt = createdAt + 15min`. `ReservationCleanupScheduler` polls every 60s: expired RESERVED reservations are released + `stock.reservation.expired` is published → order-service consumes and cancels the order.
- **Boot-time copy** — When inventory was split out as a separate service, products were one-shot copied from catalog's MongoDB; controlled by a flag.

### API

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/v1/inventory/{productId}` | Single-product stock |
| `POST` | `/api/v1/inventory/batch` | Multi-product stock (for catalog Feign) |
| `GET`  | `/api/v1/inventory/seller/{userId}/stats` | Total/in-stock/out-of-stock/low-stock counts |
| `PUT`  | `/api/v1/inventory/{productId}/stock` | Setpoint (manual stock set) |

### Saga Participant Flow

1. Consume `order.created` → `stockService.reserve(orderId, items)`
2. Atomic decrement for each item
3. All succeed → save reservation → publish `stock.reserved`
4. One item insufficient → rollback prior decrements → publish `stock.reservation.failed` without saving reservation
5. After each decrement/increment, publish `stock.changed` (for catalog + search sync)
6. On `order.cancelled` → `release()` → stocks restored → publish `stock.changed`
7. On reservation TTL expiry, scheduler calls `release()` + publishes `stock.reservation.expired`
