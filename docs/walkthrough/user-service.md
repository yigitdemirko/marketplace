# user-service — Walkthrough

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
7. [Auth Akışı](#auth-akışı)

### Sorumluluk

Kullanıcı kaydı, login, çıkış ve oturum yönetimi. Buyer ve seller iki ayrı hesap tipi (`accountType`) olarak modellendi; profil verileri ayrı tablolarda. Adres ve kayıtlı kart yönetimi de bu serviste. JWT access token + opak refresh token üretir; her ikisi de httpOnly cookie ile döner.

### Bağımlılıklar

- **PostgreSQL** (`user_db`) — `users`, `buyer_profiles`, `seller_profiles`, `refresh_tokens`, `saved_addresses`, `saved_cards`
- **Redis** — refresh token hızlı arama (`auth:refresh:{sha256(token)} → userId`)
- **JWT** — access token imzalama (HS256)

### Veri Modeli

```
users               (id, email, password_hash, account_type, created_at)
buyer_profiles      (user_id, first_name, last_name)
seller_profiles     (user_id, store_name, tax_number, phone)
refresh_tokens      (id, user_id, token_hash, ip, user_agent, session_id, revoked, expires_at)
saved_addresses     (id, user_id, label, line1, city, postal_code, ...)
saved_cards         (id, user_id, last4, brand, expire_month, expire_year, iyzico_card_token)
```

### Önemli Dosyalar

| Dosya | Sorumluluk |
|-------|-----------|
| `application/service/AuthService.java` | register, login, refresh, logout, logout-all, replay detection |
| `application/service/ProfileService.java` | profil CRUD, adres/kart yönetimi |
| `infrastructure/security/JwtUtil.java` | JWT üret/doğrula |
| `infrastructure/security/CookieUtil.java` | httpOnly cookie inşa |
| `infrastructure/redis/RefreshTokenRedisRepository.java` | Redis'te refresh token hızlı arama |
| `domain/model/RefreshToken.java` | DB entity, audit alanları |
| `api/v1/controller/AuthController.java` | `/api/v1/auth/**` endpoint'leri |

### Önemli Patternler

- **Çift token + httpOnly cookie** — Access (15dk JWT) + Refresh (7 gün opak random). Her ikisi `Secure; SameSite=Lax`. Refresh `Path=/api/v1/auth/refresh` kısıtlamalı.
- **Refresh token rotation** — Her refresh çağrısı eski token'ı revoke eder, yeni token verir. Çalınan token bir kez kullanıldığında diğeri geçersiz.
- **Replay attack detection** — Revoked bir token tekrar sunulursa, kullanıcının tüm aktif oturumları (Redis + DB) iptal edilir. Saldırgan ve gerçek kullanıcı arasında ayırt edemediğinden konservatif davranır.
- **Çift katmanlı saklama** — Redis hızlı (her API çağrısı), Postgres audit (eviction'a dayanıklı, IP/user-agent forensics).
- **Multi-session** — Her login bağımsız token çifti üretir. `session_id` ile her oturum izlenir; logout-all hepsini iptal eder.
- **Token hash** — Refresh token cookie'de plaintext, DB'de SHA-256 hash. DB sızıntısı tek başına token vermez.

### API

| Method | Path | Açıklama |
|--------|------|----------|
| `POST` | `/api/v1/auth/buyer/register` | Buyer kaydı + cookie |
| `POST` | `/api/v1/auth/seller/register` | Seller kaydı + cookie |
| `POST` | `/api/v1/auth/login` | Login + cookie |
| `POST` | `/api/v1/auth/refresh` | Refresh rotation |
| `POST` | `/api/v1/auth/logout` | Mevcut oturum iptal |
| `POST` | `/api/v1/auth/logout-all` | Tüm oturumlar iptal |
| `GET`  | `/api/v1/auth/me` | Cookie'den user info |
| `GET`  | `/api/v1/users/seller/{userId}` | Public seller profili |
| `GET`  | `/api/v1/users/{userId}/contact` | E-posta (notification-service Feign için) |
| `GET`  | `/api/v1/users/me/addresses` | Kullanıcının kayıtlı adresleri |
| `POST` | `/api/v1/users/me/addresses` | Adres ekle |
| `GET`  | `/api/v1/users/me/cards` | Kayıtlı kartlar |

### Auth Akışı

1. **Login:** Body'de email+password → DB'de doğrula → JWT üret (15dk) → opak random refresh token üret → SHA-256 hash'le → DB+Redis'e yaz → her ikisi cookie olarak yanıtta
2. **Sayfa yüklemede:** Frontend `GET /auth/me` → cookie geçerliyse user info döner
3. **Access expire:** apiClient 401 yakalar → `POST /auth/refresh` → yeni cookie'ler → kuyruktaki istekler tekrar gönderilir
4. **Replay:** Revoke edilmiş token gelir → tüm oturumlar iptal → 401 + login redirect

---

## English

### Table of Contents

1. [Responsibility](#responsibility)
2. [Dependencies](#dependencies)
3. [Data Model](#data-model)
4. [Key Files](#key-files)
5. [Key Patterns](#key-patterns)
6. [API](#api-1)
7. [Auth Flow](#auth-flow)

### Responsibility

User registration, login, logout, and session management. Buyer and seller are modeled as two separate account types (`accountType`); profile data lives in separate tables. Saved addresses and saved cards are also handled here. Issues JWT access tokens + opaque refresh tokens; both returned as httpOnly cookies.

### Dependencies

- **PostgreSQL** (`user_db`) — `users`, `buyer_profiles`, `seller_profiles`, `refresh_tokens`, `saved_addresses`, `saved_cards`
- **Redis** — fast refresh token lookup (`auth:refresh:{sha256(token)} → userId`)
- **JWT** — access token signing (HS256)

### Data Model

```
users               (id, email, password_hash, account_type, created_at)
buyer_profiles      (user_id, first_name, last_name)
seller_profiles     (user_id, store_name, tax_number, phone)
refresh_tokens      (id, user_id, token_hash, ip, user_agent, session_id, revoked, expires_at)
saved_addresses     (id, user_id, label, line1, city, postal_code, ...)
saved_cards         (id, user_id, last4, brand, expire_month, expire_year, iyzico_card_token)
```

### Key Files

| File | Responsibility |
|------|---------------|
| `application/service/AuthService.java` | register, login, refresh, logout, logout-all, replay detection |
| `application/service/ProfileService.java` | profile CRUD, address/card management |
| `infrastructure/security/JwtUtil.java` | JWT issue/validate |
| `infrastructure/security/CookieUtil.java` | httpOnly cookie construction |
| `infrastructure/redis/RefreshTokenRedisRepository.java` | Fast Redis-side refresh token lookup |
| `domain/model/RefreshToken.java` | DB entity with audit fields |
| `api/v1/controller/AuthController.java` | `/api/v1/auth/**` endpoints |

### Key Patterns

- **Dual-token + httpOnly cookie** — Access (15min JWT) + Refresh (7-day opaque random). Both `Secure; SameSite=Lax`. Refresh restricted to `Path=/api/v1/auth/refresh`.
- **Refresh token rotation** — Every refresh call revokes the old token and issues a new one. A stolen token used once invalidates the legitimate one.
- **Replay attack detection** — If a revoked token is presented again, all of the user's active sessions (Redis + DB) are revoked. Since the attacker and the legitimate user can't be distinguished, the system is conservative.
- **Dual-layer storage** — Redis fast (every API call), Postgres audit (survives eviction, IP/user-agent forensics).
- **Multi-session** — Each login issues an independent token pair. `session_id` tracks each session; logout-all revokes them all.
- **Token hashing** — Refresh token plaintext only in cookie, SHA-256 hash in DB. DB leak alone doesn't yield tokens.

### API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/buyer/register` | Buyer registration + cookie |
| `POST` | `/api/v1/auth/seller/register` | Seller registration + cookie |
| `POST` | `/api/v1/auth/login` | Login + cookie |
| `POST` | `/api/v1/auth/refresh` | Refresh rotation |
| `POST` | `/api/v1/auth/logout` | Revoke current session |
| `POST` | `/api/v1/auth/logout-all` | Revoke all sessions |
| `GET`  | `/api/v1/auth/me` | User info from cookie |
| `GET`  | `/api/v1/users/seller/{userId}` | Public seller profile |
| `GET`  | `/api/v1/users/{userId}/contact` | Email (for notification-service Feign) |
| `GET`  | `/api/v1/users/me/addresses` | User's saved addresses |
| `POST` | `/api/v1/users/me/addresses` | Add address |
| `GET`  | `/api/v1/users/me/cards` | Saved cards |

### Auth Flow

1. **Login:** body has email+password → validate in DB → issue JWT (15min) → generate opaque random refresh token → SHA-256 hash → write to DB+Redis → both returned as cookies in response
2. **On page load:** frontend calls `GET /auth/me` → if cookie is valid, returns user info
3. **Access expired:** apiClient catches 401 → `POST /auth/refresh` → new cookies → queued requests retried
4. **Replay:** revoked token presented → all sessions revoked → 401 + login redirect
