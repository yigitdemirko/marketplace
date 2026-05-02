# catalog-service — Walkthrough

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
7. [Olay Akışları](#olay-akışları)

### Sorumluluk

Ürün kataloğunun sahibi. Ürün CRUD, validate (sipariş için fiyat doğrulama), seller stats ve image upload bu serviste. Stok bilgisi ise inventory-service'in sorumluluğunda — catalog Feign+CB ile orayı sorgular ve cache olarak `Product.stock` alanında tutar (`stock.changed` event'leri ile senkronize). Bu, CQRS read-model pattern'i.

### Bağımlılıklar

- **MongoDB** (`product_db`) — `products` koleksiyonu
- **Redis** — ürün listesi cache
- **Kafka** — publisher (`product.created`, `product.updated`, `product.deleted`); consumer (`stock.changed`)
- **Feign → inventory-service** — stok okuma + setpoint
- **S3 (Hetzner Object Storage)** — ürün görselleri

### Veri Modeli

```
products  (id, sellerId, name, description, price, stock_cached, categoryId, images[],
           attributes{}, brand, active, createdAt)
```

> `stock_cached` field'ı inventory'den senkronize edilen read-model; truth değildir.

### Önemli Dosyalar

| Dosya | Sorumluluk |
|-------|-----------|
| `application/service/ProductService.java` | CRUD, validate, seller stats |
| `application/service/StockChangedConsumer.java` | `stock.changed` consume → cached Product.stock güncelle → `product.updated` re-publish |
| `infrastructure/messaging/ProductEventPublisher.java` | `product.created/updated/deleted` yayınla |
| `infrastructure/client/InventoryClient.java` | Feign interface |
| `infrastructure/client/InventoryGateway.java` | `@CircuitBreaker(name="inventory")` ile sarılı |
| `infrastructure/client/InventoryUnavailableException.java` | CB-open fail-fast exception |
| `infrastructure/storage/S3ImageUploadService.java` | Image upload, AWS SDK v2 |
| `api/v1/controller/ProductController.java` | REST endpoint'leri |

### Önemli Patternler

- **CQRS read model** — Inventory truth, catalog cached. Stock değişince `stock.changed` event'i geldiğinde cached `Product.stock` güncellenir, sonra `product.updated` yayınlanır → search-service indeksi de güncellenir.
- **Circuit breaker per call** — `getStockBatch` → fail-fast (sipariş kritik), `getSellerStats` → graceful degrade (Optional.empty fallback), `setStock` → fail-fast (admin operasyonu kayıp olmamalı).
- **Server-authoritative validate** — `POST /products/validate` (productId, quantity) listesi alır, (currentPrice, sellerId, availableStock, valid, reason) döner. Order-service bunu çağırır → fiyat tampering kapatılır.
- **Conditional S3Client bean** — `@ConditionalOnProperty("storage.s3.endpoint")` → credentials yoksa ayağa kalkar (testler için).
- **Brand + attributes flexible** — Google Merchant feed import'undan gelen meta data `attributes Map<String, String>` field'ında tutulur.

### API

| Method | Path | Açıklama |
|--------|------|----------|
| `GET`  | `/api/v1/products` | Listeleme + pagination + filter |
| `GET`  | `/api/v1/products/{id}` | Ürün detay |
| `POST` | `/api/v1/products` | Seller ürün oluştur |
| `PUT`  | `/api/v1/products/{id}` | Seller ürün güncelle (stock değişimi inventory'e set) |
| `DELETE` | `/api/v1/products/{id}` | Seller ürün sil |
| `POST` | `/api/v1/products/validate` | Server-authoritative fiyat + stok |
| `POST` | `/api/v1/products/batch` | Toplu oluşturma (feed-ingestion için) |
| `POST` | `/api/v1/products/images/upload` | S3'e görsel yükleme |
| `GET`  | `/api/v1/products/seller/{userId}/stats` | Seller dashboard verisi |

### Olay Akışları

**Ürün oluşturma:**
- `POST /products` → MongoDB'ye yaz → `product.created` yayınla → inventory-service consume eder, `ProductStock` doc'u oluşturur

**Stok değişimi (saga'dan):**
- inventory `findAndModify` → `stock.changed` yayınlar
- catalog consume → cached `Product.stock` güncelle → `product.updated` yayınla
- search-service consume → Elasticsearch indeksi güncelle

**Stock setpoint (seller manual):**
- Seller `PUT /products/{id}` body'de yeni `stock` → catalog `inventoryGateway.setStock()` → 200 ise local Product.stock güncelle, değilse 503 (drift önlenir)

---

## English

### Table of Contents

1. [Responsibility](#responsibility)
2. [Dependencies](#dependencies)
3. [Data Model](#data-model)
4. [Key Files](#key-files)
5. [Key Patterns](#key-patterns)
6. [API](#api-1)
7. [Event Flows](#event-flows)

### Responsibility

Owner of the product catalog. Product CRUD, validate (price check for orders), seller stats, and image upload all live here. Stock truth lives in inventory-service — catalog queries it via Feign+CB and keeps a cached `Product.stock` field synced via `stock.changed` events. This is the CQRS read-model pattern.

### Dependencies

- **MongoDB** (`product_db`) — `products` collection
- **Redis** — product list cache
- **Kafka** — publisher (`product.created`, `product.updated`, `product.deleted`); consumer (`stock.changed`)
- **Feign → inventory-service** — read stock + setpoint
- **S3 (Hetzner Object Storage)** — product images

### Data Model

```
products  (id, sellerId, name, description, price, stock_cached, categoryId, images[],
           attributes{}, brand, active, createdAt)
```

> `stock_cached` is the read-model synced from inventory; it is **not** the truth.

### Key Files

| File | Responsibility |
|------|---------------|
| `application/service/ProductService.java` | CRUD, validate, seller stats |
| `application/service/StockChangedConsumer.java` | Consume `stock.changed` → update cached Product.stock → re-publish `product.updated` |
| `infrastructure/messaging/ProductEventPublisher.java` | Publish `product.created/updated/deleted` |
| `infrastructure/client/InventoryClient.java` | Feign interface |
| `infrastructure/client/InventoryGateway.java` | Wrapped with `@CircuitBreaker(name="inventory")` |
| `infrastructure/client/InventoryUnavailableException.java` | CB-open fail-fast exception |
| `infrastructure/storage/S3ImageUploadService.java` | Image upload, AWS SDK v2 |
| `api/v1/controller/ProductController.java` | REST endpoints |

### Key Patterns

- **CQRS read model** — Inventory holds truth, catalog holds cached. When stock changes, `stock.changed` arrives, cached `Product.stock` is updated, and `product.updated` is published → search-service index also updates.
- **Per-call circuit breaker** — `getStockBatch` → fail-fast (order critical), `getSellerStats` → graceful degrade (Optional.empty fallback), `setStock` → fail-fast (admin op must not silently fail).
- **Server-authoritative validate** — `POST /products/validate` takes (productId, quantity) list, returns (currentPrice, sellerId, availableStock, valid, reason). order-service calls this → price tampering closed.
- **Conditional S3Client bean** — `@ConditionalOnProperty("storage.s3.endpoint")` → boots even without credentials (for tests).
- **Brand + attributes flexible** — Google Merchant feed import metadata is stored in the `attributes Map<String, String>` field.

### API

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/v1/products` | List + pagination + filter |
| `GET`  | `/api/v1/products/{id}` | Product detail |
| `POST` | `/api/v1/products` | Seller create product |
| `PUT`  | `/api/v1/products/{id}` | Seller update (stock change → inventory set) |
| `DELETE` | `/api/v1/products/{id}` | Seller delete |
| `POST` | `/api/v1/products/validate` | Server-authoritative price + stock |
| `POST` | `/api/v1/products/batch` | Bulk create (for feed-ingestion) |
| `POST` | `/api/v1/products/images/upload` | S3 image upload |
| `GET`  | `/api/v1/products/seller/{userId}/stats` | Seller dashboard data |

### Event Flows

**Product creation:**
- `POST /products` → write to MongoDB → publish `product.created` → inventory-service consumes, creates `ProductStock` doc

**Stock change (from saga):**
- inventory `findAndModify` → publishes `stock.changed`
- catalog consumes → update cached `Product.stock` → publish `product.updated`
- search-service consumes → update Elasticsearch index

**Stock setpoint (manual seller):**
- Seller `PUT /products/{id}` with new `stock` in body → catalog calls `inventoryGateway.setStock()` → if 200, update local Product.stock; otherwise 503 (drift is prevented)
