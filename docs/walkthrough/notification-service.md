# notification-service — Walkthrough

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

### Sorumluluk

In-app bildirim merkezi. Saga olaylarını (sipariş oluştu, ödeme tamamlandı, ödeme başarısız, sipariş iptal) Kafka'dan dinler ve kullanıcının bildirim kutusuna yazar. Frontend SSE üzerinden gerçek zamanlı bildirim alır. (Önceden e-posta tabanlıydı; PR-132 ile in-app inbox'a pivot edildi.)

### Bağımlılıklar

- **PostgreSQL** (`notification_db`) — `notifications` tablosu
- **Kafka** — consumer (`order.created`, `order.cancelled`, `payment.completed`, `payment.failed`)
- **Feign → user-service** — kullanıcı bilgisi (gerekirse)
- **Spring SSE** — frontend ile uzun ömürlü stream

### Veri Modeli

```
notifications  (id, userId, type, title, message, link, read, createdAt)
               type: ORDER_CREATED | PAYMENT_COMPLETED | PAYMENT_FAILED | ORDER_CANCELLED
```

### Önemli Dosyalar

| Dosya | Sorumluluk |
|-------|-----------|
| `application/service/NotificationService.java` | Bildirim oluştur, listele, okundu işaretle |
| `infrastructure/messaging/NotificationEventConsumer.java` | 4 saga olayı dinler, her biri için bildirim yazar |
| `infrastructure/sse/NotificationStreamRegistry.java` | Aktif SSE bağlantılarını yönet (userId → emitter listesi) |
| `infrastructure/sse/SseHeartbeat.java` | `@Scheduled` heartbeat → bağlantı kopukluğu tespit |
| `api/v1/controller/NotificationController.java` | REST: list / mark read / unread count |
| `api/v1/controller/NotificationStreamController.java` | SSE endpoint |

### Önemli Patternler

- **Pure Kafka consumer** — Hiç REST POST endpoint'i yok bildirim oluşturmak için; bildirim sadece saga olaylarından gelir. Endpoint hijack riski yok.
- **In-app inbox + SSE** — Persisted `notifications` tablosu + frontend için real-time push. SSE bağlantı kapansa bile sayfa yenilemesinde tüm bildirimler okunabilir.
- **Heartbeat polling** — SSE bağlantıları 30 sn'de bir heartbeat alır; ölü bağlantılar registry'den temizlenir.
- **Skip-on-missing-userId** — Event'te userId yoksa sessizce skip; consumer hata fırlatmaz, DLQ'ya gitmez.
- **Kafka DLT** — Tüm consumer'lar `<topic>.DLT` retry sonrası mesajları kaybetmez.

### API

| Method | Path | Açıklama |
|--------|------|----------|
| `GET`  | `/api/v1/notifications` | Listele (pagination) |
| `GET`  | `/api/v1/notifications/unread-count` | Okunmamış sayısı |
| `PATCH`| `/api/v1/notifications/{id}/read` | Tek bildirimi okundu işaretle |
| `PATCH`| `/api/v1/notifications/read-all` | Hepsini okundu işaretle |
| `GET`  | `/api/v1/notifications/stream` | SSE — yeni bildirim push'u |

---

## English

### Table of Contents

1. [Responsibility](#responsibility)
2. [Dependencies](#dependencies)
3. [Data Model](#data-model)
4. [Key Files](#key-files)
5. [Key Patterns](#key-patterns)
6. [API](#api-1)

### Responsibility

In-app notification inbox. Listens to saga events (order created, payment completed, payment failed, order cancelled) from Kafka and writes to the user's inbox. Frontend receives realtime push via SSE. (Was email-based; PR-132 pivoted to in-app inbox.)

### Dependencies

- **PostgreSQL** (`notification_db`) — `notifications` table
- **Kafka** — consumer (`order.created`, `order.cancelled`, `payment.completed`, `payment.failed`)
- **Feign → user-service** — user info (when needed)
- **Spring SSE** — long-lived stream to frontend

### Data Model

```
notifications  (id, userId, type, title, message, link, read, createdAt)
               type: ORDER_CREATED | PAYMENT_COMPLETED | PAYMENT_FAILED | ORDER_CANCELLED
```

### Key Files

| File | Responsibility |
|------|---------------|
| `application/service/NotificationService.java` | Create, list, mark-read |
| `infrastructure/messaging/NotificationEventConsumer.java` | Listens to 4 saga events, writes a notification for each |
| `infrastructure/sse/NotificationStreamRegistry.java` | Manages active SSE connections (userId → emitter list) |
| `infrastructure/sse/SseHeartbeat.java` | `@Scheduled` heartbeat → detect dropped connections |
| `api/v1/controller/NotificationController.java` | REST: list / mark read / unread count |
| `api/v1/controller/NotificationStreamController.java` | SSE endpoint |

### Key Patterns

- **Pure Kafka consumer** — No REST POST endpoint to create notifications; notifications only come from saga events. No endpoint hijack risk.
- **In-app inbox + SSE** — Persisted `notifications` table + realtime push to frontend. Even if SSE drops, all notifications are visible after a page refresh.
- **Heartbeat polling** — SSE connections receive a heartbeat every 30s; dead connections are cleaned from the registry.
- **Skip-on-missing-userId** — If userId is missing in the event, silently skip; consumer doesn't throw, doesn't go to DLQ.
- **Kafka DLT** — All consumers have `<topic>.DLT`, no message loss after retries.

### API

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/v1/notifications` | List (paginated) |
| `GET`  | `/api/v1/notifications/unread-count` | Unread count |
| `PATCH`| `/api/v1/notifications/{id}/read` | Mark single as read |
| `PATCH`| `/api/v1/notifications/read-all` | Mark all as read |
| `GET`  | `/api/v1/notifications/stream` | SSE — new notification push |
