# api-gateway — Walkthrough

**Diller / Languages:** [Türkçe](#türkçe) · [English](#english)

[← Tüm servisler / All services](./README.md) · [README.md](../../README.md)

---

## Türkçe

### İçindekiler

1. [Sorumluluk](#sorumluluk)
2. [Bağımlılıklar](#bağımlılıklar)
3. [Önemli Dosyalar](#önemli-dosyalar)
4. [Önemli Patternler](#önemli-patternler)
5. [Routing](#routing)

### Sorumluluk

Tek giriş noktası. Frontend ve dış istemciler tüm istekleri buraya gönderir. Spring Cloud Gateway, isteği path'e göre uygun servise yönlendirir (Eureka üzerinden discovery). Aynı zamanda JWT auth filter'ı çalıştırır: `access_token` cookie'sinden kullanıcıyı doğrular ve downstream servisler için `X-User-Id`, `X-User-Email`, `X-Account-Type` header'larını ekler.

### Bağımlılıklar

- **config-server** — routing config'i buradan çekilir
- **discovery-server** — servis adresleri buradan çözülür
- **user-service** — JWT secret aynı; gateway sadece doğrular, üretmez

### Önemli Dosyalar

| Dosya | Sorumluluk |
|-------|-----------|
| `ApiGatewayApplication.java` | Spring Boot entry point |
| `filter/JwtAuthFilter.java` | Global filter; cookie oku → JWT doğrula → identity header'larını ekle |
| Config'deki `spring.cloud.gateway.routes` | Path-to-service routing kuralları |

### Önemli Patternler

- **Identity header injection** — `JwtAuthFilter.filter()` önce gelen `X-User-Id`, `X-User-Email`, `X-Account-Type` header'larını **siler** (saldırgan tarafından spoofed header'ı önlemek için), sonra cookie'deki valid JWT'den kendisi ekler. Downstream servisler bu header'lara güvenir, JWT'yi tekrar doğrulamaz.
- **httpOnly cookie auth** — Token tarayıcı tarafından `localStorage`'a yazılamaz; XSS ile çalınamaz. `Path=/api/v1/auth/refresh` kısıtlaması refresh token'ın yanlışlıkla başka endpoint'e gönderilmesini engeller.
- **Reactive (WebFlux)** — Spring Cloud Gateway non-blocking. Yüksek concurrent throughput ama servlet stack'inden farklı debug deneyimi.
- **Filter order** — `JwtAuthFilter.getOrder() = -1` → routing'den önce çalışır.
- **Public vs auth'd endpoint'ler** — Gateway hepsini geçirir; her servis kendi endpoint'inde authorization yapar.

### Routing

Tüm servisler `/api/v1/*` prefix'i altında:

| Path | Hedef Servis |
|------|--------------|
| `/api/v1/auth/**` | user-service |
| `/api/v1/users/**` | user-service |
| `/api/v1/products/**` | catalog-service |
| `/api/v1/inventory/**` | inventory-service |
| `/api/v1/search/**` | search-service |
| `/api/v1/orders/**` | order-service |
| `/api/v1/payments/**` | payment-service |
| `/api/v1/feeds/**` | feed-ingestion-service |
| `/api/v1/notifications/**` | notification-service |
| `/swagger-ui/**`, `/v3/api-docs/**` | aggregated swagger UI |

---

## English

### Table of Contents

1. [Responsibility](#responsibility)
2. [Dependencies](#dependencies)
3. [Key Files](#key-files)
4. [Key Patterns](#key-patterns)
5. [Routing](#routing-1)

### Responsibility

Single entry point. Frontend and external clients send all requests here. Spring Cloud Gateway routes based on path to the appropriate service (via Eureka discovery). Also runs the JWT auth filter: validates the user from the `access_token` cookie and adds `X-User-Id`, `X-User-Email`, `X-Account-Type` headers for downstream services.

### Dependencies

- **config-server** — routing config pulled from here
- **discovery-server** — service addresses resolved here
- **user-service** — shares JWT secret; gateway validates but does not issue tokens

### Key Files

| File | Responsibility |
|------|---------------|
| `ApiGatewayApplication.java` | Spring Boot entry point |
| `filter/JwtAuthFilter.java` | Global filter; read cookie → validate JWT → add identity headers |
| Config's `spring.cloud.gateway.routes` | Path-to-service routing rules |

### Key Patterns

- **Identity header injection** — `JwtAuthFilter.filter()` first **strips** any incoming `X-User-Id`, `X-User-Email`, `X-Account-Type` headers (prevents attacker injection), then adds them itself if a valid JWT cookie is present. Downstream services trust these headers and do not re-validate the JWT.
- **httpOnly cookie auth** — Tokens cannot be written to `localStorage` by the browser; cannot be stolen via XSS. `Path=/api/v1/auth/refresh` restriction prevents refresh tokens from being accidentally sent to other endpoints.
- **Reactive (WebFlux)** — Spring Cloud Gateway is non-blocking. High concurrent throughput but a different debug experience than the servlet stack.
- **Filter order** — `JwtAuthFilter.getOrder() = -1` → runs before routing.
- **Public vs authenticated endpoints** — Gateway forwards all; each service handles authorization on its own endpoints.

### Routing

All services live under the `/api/v1/*` prefix:

| Path | Target Service |
|------|----------------|
| `/api/v1/auth/**` | user-service |
| `/api/v1/users/**` | user-service |
| `/api/v1/products/**` | catalog-service |
| `/api/v1/inventory/**` | inventory-service |
| `/api/v1/search/**` | search-service |
| `/api/v1/orders/**` | order-service |
| `/api/v1/payments/**` | payment-service |
| `/api/v1/feeds/**` | feed-ingestion-service |
| `/api/v1/notifications/**` | notification-service |
| `/swagger-ui/**`, `/v3/api-docs/**` | aggregated swagger UI |
