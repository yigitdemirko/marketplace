# basket-service — Walkthrough

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
7. [Frontend Akışı](#frontend-akışı)

### Sorumluluk

Server-side shopping cart. Her kullanıcının sepetini Redis'te kullanıcı başına tutar (TTL'li). Catalog'dan Feign+CB ile fiyat/isim/stok bilgisini çekerek hydrated bir görünüm döner. `order.created` Kafka event'ini consume edip sipariş edilen ürünleri buyer'ın sepetinden temizler. Anonim sepet client'ta (Zustand persist) tutulur; kullanıcı login olduğunda `/merge` endpoint'i ile server tarafına aktarılır. Demo'da hesap değiştirildiğinde sepet sızıntısını engeller.

### Bağımlılıklar

- **Redis** — `basket:user:{userId}` HSET, 30 gün TTL
- **Kafka** — consumer (`order.created`); publisher yok
- **Feign → catalog-service** — hydration için `POST /products/validate` (price + name + image + stock)
- **Eureka + Config Server** — discovery + konfigürasyon

### Veri Modeli

Redis HSET, key başına bir hash:

```
key:    basket:user:{userId}
fields: {productId} → {quantity}
TTL:    30 gün (her güncelleme TTL'i sıfırlar)
```

Domain'de hiçbir fiyat/isim saklanmaz — sadece intent (productId + adet). Fiyat ve görsel her okumada catalog'dan çekilir; bu PR-79'daki server-authoritative pricing prensibi ile uyumlu.

### Önemli Dosyalar

| Dosya | Sorumluluk |
|-------|-----------|
| `application/service/BasketService.java` | add/set/remove/clear/merge use case'leri; max-items + max-qty cap'leri |
| `application/service/BasketHydrator.java` | Map<productId, qty> → enriched response (catalog Feign çağrısı + line total hesabı) |
| `infrastructure/redis/RedisBasketRepository.java` | HSET-based persistence, TTL refresh |
| `infrastructure/messaging/OrderEventConsumer.java` | `order.created` consume → buyer'ın sepetinden order item'larını siler |
| `infrastructure/client/CatalogClient.java` | Feign interface |
| `infrastructure/client/CatalogGateway.java` | `@CircuitBreaker(name="catalog")` ile sarılı; CB-open'da empty list döner (graceful degrade) |
| `api/v1/controller/BasketController.java` | 6 REST endpoint |
| `domain/repository/BasketRepository.java` | Domain interface (Redis bağımsız) |

### Önemli Patternler

- **Sadece intent** — Sepet `Map<productId, quantity>` saklar. Fiyat, isim, görsel **read time'da** catalog'dan çekilir. Demo: ürün fiyatı değişirse sepet otomatik güncel fiyatı gösterir; fiyat tampering imkânı yok.
- **Per-user Redis HSET** — Atomik field-level operasyonlar (`HINCRBY`, `HDEL`). Concurrent two-tab edit race-safe.
- **Auto-clear after order** — `order.created` event consumer'ı sipariş edilen ürünleri sepetten siler; idempotent (Redis HDEL doğal idempotent).
- **Merge-on-login (max strategy)** — Login'de anon items + server items birleşir; çakışan productId için `max(local, server)` (Amazon tarzı, en az sürpriz). 50 distinct item cap aşılırsa trim.
- **Circuit breaker** — Catalog down olduğunda hydration empty list ile fallback yapar; sepet items dönüş olarak `{productId, quantity}` korunur ama detay alanları null olur ve frontend "details unavailable" gösterir. Sepet hâlâ erişilebilir.
- **Graceful TTL refresh** — Her yazma operasyonu TTL'i 30 gün tazeler; aktif kullanıcının sepeti süresiz korunur, terkedilen sepet 30 gün sonra otomatik silinir.
- **Demo bug fix (PR-139)** — Önce `localStorage`'da tutulan sepet hesap değişikliklerinde sızıyordu; şimdi login → server merge + clear local; logout → invalidate query + clear local.

### API

Tüm endpoint'ler `X-User-Id` header'ı bekler (gateway tarafından koyulur).

| Method | Path | Açıklama |
|--------|------|----------|
| `GET` | `/api/v1/basket` | Hydrated cart (price + name + image + stock + line total + grand total) |
| `POST` | `/api/v1/basket/items` | `{productId, quantity}` — varsa toplama, yoksa ekle |
| `PATCH` | `/api/v1/basket/items/{productId}` | `{quantity}` — set; 0 silme anlamına gelir |
| `DELETE` | `/api/v1/basket/items/{productId}` | Tek ürünü kaldır |
| `DELETE` | `/api/v1/basket` | Sepeti tamamen boşalt |
| `POST` | `/api/v1/basket/merge` | `{items: [{productId, quantity}, ...]}` — anon → server max-strategy birleştirme |

### Frontend Akışı

1. **Anon kullanıcı** — `useCartStore` (Zustand persist `cart-storage`) localStorage'da tutar
2. **`useBasket()` hook** — auth'a göre branch'lenir: logged-in ise TanStack Query `/basket`, anon ise local store map'lenir → her iki durumda aynı `UnifiedBasketItem[]` döner
3. **Mutations** — `useAddBasketItem`, `useSetBasketItem`, `useRemoveBasketItem`, `useClearBasket` — auth-aware (server REST veya local store)
4. **`useAuthFlow.onLoginSuccess(user)`** — sadece BUYER için, anon items'ı `/basket/merge`'e POST → local clear → `setAuth(user)` → query invalidate
5. **`useAuthFlow.onLogout()`** — local clear → query cache remove → store logout
6. **Tutar limiti UI'ı** — sepet/checkout'ta toplam > %90 sarı banner; > %100 kırmızı banner + checkout button disabled (server-side 422 olmasa bile UX hazır)

---

## English

### Table of Contents

1. [Responsibility](#responsibility)
2. [Dependencies](#dependencies)
3. [Data Model](#data-model)
4. [Key Files](#key-files)
5. [Key Patterns](#key-patterns)
6. [API](#api-1)
7. [Frontend Flow](#frontend-flow)

### Responsibility

Server-side shopping cart. Stores each user's basket in Redis on a per-user key with a TTL. Hydrates the basket via Feign+CB to catalog (price/name/image/stock). Consumes the `order.created` Kafka event to remove ordered items from the buyer's basket. Anonymous baskets live client-side (Zustand persist); on login the anon items are merged into the server basket via `/merge`. Fixes the demo bug where the cart leaked across accounts in the same browser.

### Dependencies

- **Redis** — `basket:user:{userId}` HSET, 30-day TTL
- **Kafka** — consumer (`order.created`); no publishers
- **Feign → catalog-service** — `POST /products/validate` for hydration (price + name + image + stock)
- **Eureka + Config Server** — discovery + configuration

### Data Model

Redis HSET, one hash per user:

```
key:    basket:user:{userId}
fields: {productId} → {quantity}
TTL:    30 days (every write resets TTL)
```

No price/name/image is stored — only intent (productId + quantity). Price and image are pulled from catalog on every read; aligned with the server-authoritative pricing principle from PR-79.

### Key Files

| File | Responsibility |
|------|---------------|
| `application/service/BasketService.java` | add/set/remove/clear/merge use cases; max-items + max-qty caps |
| `application/service/BasketHydrator.java` | Map<productId, qty> → enriched response (catalog Feign call + line totals) |
| `infrastructure/redis/RedisBasketRepository.java` | HSET-based persistence, TTL refresh |
| `infrastructure/messaging/OrderEventConsumer.java` | Consume `order.created` → remove ordered items from buyer's basket |
| `infrastructure/client/CatalogClient.java` | Feign interface |
| `infrastructure/client/CatalogGateway.java` | Wrapped with `@CircuitBreaker(name="catalog")`; returns empty list when CB-open (graceful degrade) |
| `api/v1/controller/BasketController.java` | 6 REST endpoints |
| `domain/repository/BasketRepository.java` | Domain interface (Redis-agnostic) |

### Key Patterns

- **Intent only** — Basket stores `Map<productId, quantity>`. Price, name, image are pulled at **read time** from catalog. Demo: if a product price changes, the basket reflects current price; price tampering is impossible.
- **Per-user Redis HSET** — Atomic field-level operations (`HINCRBY`, `HDEL`). Concurrent two-tab edits are race-safe.
- **Auto-clear after order** — `order.created` consumer removes ordered items; idempotent (Redis `HDEL` is naturally idempotent).
- **Merge-on-login (max strategy)** — On login, anon items + server items merge with `max(local, server)` per overlapping productId (Amazon-style, least surprise). Trims if 50-distinct-item cap exceeded.
- **Circuit breaker** — When catalog is down, hydration falls back to an empty list; `{productId, quantity}` are still returned but detail fields are null and the frontend shows "details unavailable". The basket itself stays accessible.
- **Graceful TTL refresh** — Every write resets TTL to 30 days; an active user's basket persists, abandoned baskets self-clean after 30 days.
- **Demo bug fix (PR-139)** — Previously the cart was held in `localStorage` and leaked across account switches; now login → server merge + clear local; logout → invalidate query + clear local.

### API

All endpoints expect `X-User-Id` (set by the gateway).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/basket` | Hydrated cart (price + name + image + stock + line total + grand total) |
| `POST` | `/api/v1/basket/items` | `{productId, quantity}` — sum if exists, add otherwise |
| `PATCH` | `/api/v1/basket/items/{productId}` | `{quantity}` — set; 0 means remove |
| `DELETE` | `/api/v1/basket/items/{productId}` | Remove a single item |
| `DELETE` | `/api/v1/basket` | Clear basket entirely |
| `POST` | `/api/v1/basket/merge` | `{items: [{productId, quantity}, ...]}` — anon → server max-strategy merge |

### Frontend Flow

1. **Anon user** — `useCartStore` (Zustand persist key `cart-storage`) keeps it in localStorage
2. **`useBasket()` hook** — branches on auth: logged-in uses TanStack Query `/basket`, anon maps the local store → both return the same `UnifiedBasketItem[]`
3. **Mutations** — `useAddBasketItem`, `useSetBasketItem`, `useRemoveBasketItem`, `useClearBasket` — auth-aware (server REST or local store)
4. **`useAuthFlow.onLoginSuccess(user)`** — for BUYER only, POSTs anon items to `/basket/merge` → clears local → `setAuth(user)` → invalidates query
5. **`useAuthFlow.onLogout()`** — clears local → removes basket query cache → store logout
6. **Amount-limit UI** — at >90% of limit, yellow banner; at >100%, red banner + checkout button disabled (UX is ready even if the server returns 422 anyway)
