# config-server — Walkthrough

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

Spring Cloud Config Server. Tüm servislerin konfigürasyonunu merkezi olarak sağlar. Her servis başlangıçta `spring.application.name` ile kendi konfigürasyonunu çeker. Native profile kullanır — konfig dosyaları classpath'ten okunur, harici bir Git repo gerekmez.

### Bağımlılıklar

- Yok (kendi başına ayakta — diğer servisler buna bağımlı, tersi değil)
- Eureka'ya register **olmaz** (boot sequence'in başında çalışmalı)

### Önemli Dosyalar

| Dosya | Sorumluluk |
|-------|-----------|
| `ConfigServerApplication.java` | `@EnableConfigServer` |
| `application.yaml` | Native profile, port 8888, classpath:/configs/ kaynağı |
| `configs/*.yml` | Servis başına konfigürasyon (örn. `discovery-server.yml`) |

### Önemli Patternler

- **Native profile** — Git'e bağımlı değil, konfig dosyaları JAR içinde. Production'da bile lokal çalışır.
- **Port 8888** — Spring Cloud Config standardı.
- **Boot order kritik** — config-server, discovery-server'dan önce ayakta olmalı; diğer servisler config-server'dan önce başlatılırsa `optional:configserver:` prefix'i sayesinde çökmezler ama merkezi config almazlar.

### Erişim

```
GET http://localhost:8888/{application}/{profile}
```

Örn:
```
GET http://localhost:8888/order-service/default
```

---

## English

### Table of Contents

1. [Responsibility](#responsibility)
2. [Dependencies](#dependencies)
3. [Key Files](#key-files)
4. [Key Patterns](#key-patterns)
5. [Access](#access)

### Responsibility

Spring Cloud Config Server. Provides centralized configuration for all services. Each service pulls its own config at startup using `spring.application.name`. Uses the native profile — config files are loaded from classpath, no external Git repo needed.

### Dependencies

- None (stands alone — other services depend on it, not vice versa)
- Does **not** register with Eureka (must boot before everything else)

### Key Files

| File | Responsibility |
|------|---------------|
| `ConfigServerApplication.java` | `@EnableConfigServer` |
| `application.yaml` | Native profile, port 8888, classpath:/configs/ source |
| `configs/*.yml` | Per-service configuration (e.g. `discovery-server.yml`) |

### Key Patterns

- **Native profile** — No Git dependency, config files inside the JAR. Works locally even in production.
- **Port 8888** — Spring Cloud Config standard.
- **Boot order matters** — config-server must boot before discovery-server; if other services start first, the `optional:configserver:` prefix prevents crashes but they won't get centralized config.

### Access

```
GET http://localhost:8888/{application}/{profile}
```

Example:
```
GET http://localhost:8888/order-service/default
```
