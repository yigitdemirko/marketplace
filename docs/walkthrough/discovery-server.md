# discovery-server — Walkthrough

**Diller / Languages:** [Türkçe](#türkçe) · [English](#english)

[← Tüm servisler / All services](./README.md) · [README.md](../../README.md)

---

## Türkçe

### İçindekiler

1. [Sorumluluk](#sorumluluk)
2. [Bağımlılıklar](#bağımlılıklar)
3. [Önemli Dosyalar](#önemli-dosyalar)
4. [Önemli Patternler](#önemli-patternler)
5. [Erişim](#erişim)

### Sorumluluk

Netflix Eureka tabanlı servis keşfi. Her servis başlangıçta buraya kayıt olur ve heartbeat gönderir. Bir servis başka bir servise Feign ile çağrı yaparken (`@FeignClient(name = "catalog-service")`), Eureka'dan instance'ı bulur. Load balancing client tarafında (Spring Cloud LoadBalancer) yapılır.

### Bağımlılıklar

- **config-server** — başlangıç konfigürasyonunu buradan çeker
- Eureka'ya register **olmaz** (kendi kendisinin discovery'si)

### Önemli Dosyalar

| Dosya | Sorumluluk |
|-------|-----------|
| `DiscoveryServerApplication.java` | `@EnableEurekaServer` |
| `application.yaml` | Port 8761, kendi kendine register etmemesi için `register-with-eureka: false` |

### Önemli Patternler

- **Eureka heartbeat** — her servis 30 sn'de bir heartbeat gönderir; kaçırılırsa instance "DOWN" işaretlenir, 90 sn sonra registry'den düşürülür.
- **Self-preservation mode** — Eureka, çoklu instance kayboldukça otomatik shutdown yapmaz; ağ partition durumlarında stale registry tutmayı tercih eder. Lokal stack'te yanıltıcı olabilir.
- **Client-side load balancing** — Eureka adres listesi döner, Feign client kendisi seçer (round-robin default).

### Erişim

- Eureka dashboard: http://localhost:8761
- REST API: `GET http://localhost:8761/eureka/apps`

---

## English

### Table of Contents

1. [Responsibility](#responsibility)
2. [Dependencies](#dependencies)
3. [Key Files](#key-files)
4. [Key Patterns](#key-patterns)
5. [Access](#access)

### Responsibility

Netflix Eureka-based service discovery. Every service registers on startup and sends heartbeats. When one service calls another via Feign (`@FeignClient(name = "catalog-service")`), it looks up the instance from Eureka. Load balancing happens client-side (Spring Cloud LoadBalancer).

### Dependencies

- **config-server** — pulls startup configuration from here
- Does **not** register with Eureka (it's its own discovery)

### Key Files

| File | Responsibility |
|------|---------------|
| `DiscoveryServerApplication.java` | `@EnableEurekaServer` |
| `application.yaml` | Port 8761, `register-with-eureka: false` to avoid registering itself |

### Key Patterns

- **Eureka heartbeat** — each service heartbeats every 30s; missed heartbeats mark the instance DOWN, evicted from registry after 90s.
- **Self-preservation mode** — Eureka does not auto-shutdown when multiple instances disappear; in network partition scenarios it prefers stale registry. Can be misleading in local stack.
- **Client-side load balancing** — Eureka returns a list of addresses; Feign client picks one (round-robin by default).

### Access

- Eureka dashboard: http://localhost:8761
- REST API: `GET http://localhost:8761/eureka/apps`
