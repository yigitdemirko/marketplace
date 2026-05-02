# feed-ingestion-service — Walkthrough

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
7. [Import Akışı](#import-akışı)

### Sorumluluk

Seller'ların Google Merchant XML feed dosyalarını yükleyerek ürünlerini toplu içe aktarmasını sağlar. Dosya parse edilir, validate edilir, ardından `catalog-service`'in `POST /products/batch` endpoint'ine Feign üzerinden gönderilir. Her import bir job olarak kaydedilir; kısmi başarısızlıklar (bazı satır geçersiz) row-level error tracking ile raporlanır.

### Bağımlılıklar

- **PostgreSQL** (`feed_ingestion_db`) — `import_jobs` tablosu
- **Feign → catalog-service** — `POST /products/batch` (Resilience4j CB ile sarılı, PR-134)

### Veri Modeli

```
import_jobs  (id, sellerId, fileName, totalItems, successCount, failureCount,
              status, errors_json, createdAt, completedAt)
             status: PROCESSING | COMPLETED | FAILED
```

### Önemli Dosyalar

| Dosya | Sorumluluk |
|-------|-----------|
| `application/service/FeedImportService.java` | Job orkestrasyonu: parse → validate → batch-create |
| `application/service/CategoryMapper.java` | Google Merchant kategori kodu → marketplace kategorisi |
| `infrastructure/parser/GoogleMerchantXmlParser.java` | XML → `GoogleMerchantItem` listesi |
| `infrastructure/client/ProductServiceClient.java` | Catalog Feign interface |
| `infrastructure/client/CatalogGateway.java` | `@CircuitBreaker(name="catalog")` |
| `domain/model/ImportJob.java` | Job durum modeli |
| `api/v1/controller/FeedImportController.java` | Multipart upload + history |

### Önemli Patternler

- **Senkron Feign batch çağrısı** — Job içinde valid satırların tamamı tek `POST /products/batch` ile catalog'a iletilir. Tek tek REST yerine batch — N+1 önlenir.
- **Row-level error tracking** — Parse veya batch yanıtındaki başarısızlıklar `errors_json` alanında `[{rowIndex, productId, message}]` listesi olarak saklanır. Seller hangi ürünlerin neden hata verdiğini görür.
- **Circuit breaker** — Catalog down olduğunda `CatalogUnavailableException` fırlatır → job FAILED, downstream'de Feign call pile-up olmaz.
- **Idempotent değildir** — Aynı dosya iki kez yüklenirse ürünler iki kez oluşur. Seller'ın dikkat etmesi beklenir; gelecekte external ID + upsert ile çözülebilir.
- **Kategori mapping** — Google Merchant `Apparel & Accessories > ...` zincirinden marketplace flat kategori ID'si üretilir; eşleşmeyenler default kategoriye düşer.

### API

| Method | Path | Açıklama |
|--------|------|----------|
| `POST` | `/api/v1/feeds/import` | Multipart XML upload (seller-only) |
| `GET`  | `/api/v1/feeds/imports` | Seller'ın import geçmişi |
| `GET`  | `/api/v1/feeds/imports/{jobId}` | Tek import detay (errors dahil) |

### Import Akışı

1. Seller frontend'den XML dosyası seçer → `POST /api/v1/feeds/import`
2. ImportJob `PROCESSING` olarak persist edilir
3. `GoogleMerchantXmlParser` dosyayı çözer → `GoogleMerchantItem` listesi
4. Her item için `mapToRequest()` validate eder; hata olanlar `rowErrors`'a düşer
5. Geçerli olanlar tek seferde `catalogGateway.createBatch(sellerId, validRequests)` ile gönderilir
6. Catalog yanıtındaki başarısızlıklar (mevcut SKU, vb.) row-level error olarak eklenir
7. Job `COMPLETED` olarak kaydedilir; seller'a özet + errors döner

---

## English

### Table of Contents

1. [Responsibility](#responsibility)
2. [Dependencies](#dependencies)
3. [Data Model](#data-model)
4. [Key Files](#key-files)
5. [Key Patterns](#key-patterns)
6. [API](#api-1)
7. [Import Flow](#import-flow)

### Responsibility

Lets sellers bulk-import products by uploading Google Merchant XML feeds. Parses, validates, and forwards to `catalog-service`'s `POST /products/batch` via Feign. Every import is tracked as a job; partial failures (some rows invalid) are surfaced via row-level error tracking.

### Dependencies

- **PostgreSQL** (`feed_ingestion_db`) — `import_jobs` table
- **Feign → catalog-service** — `POST /products/batch` (wrapped with Resilience4j CB, PR-134)

### Data Model

```
import_jobs  (id, sellerId, fileName, totalItems, successCount, failureCount,
              status, errors_json, createdAt, completedAt)
             status: PROCESSING | COMPLETED | FAILED
```

### Key Files

| File | Responsibility |
|------|---------------|
| `application/service/FeedImportService.java` | Job orchestration: parse → validate → batch-create |
| `application/service/CategoryMapper.java` | Google Merchant category code → marketplace category |
| `infrastructure/parser/GoogleMerchantXmlParser.java` | XML → `GoogleMerchantItem` list |
| `infrastructure/client/ProductServiceClient.java` | Catalog Feign interface |
| `infrastructure/client/CatalogGateway.java` | `@CircuitBreaker(name="catalog")` |
| `domain/model/ImportJob.java` | Job status model |
| `api/v1/controller/FeedImportController.java` | Multipart upload + history |

### Key Patterns

- **Synchronous Feign batch call** — All valid rows in a job are forwarded to catalog in a single `POST /products/batch` call. Batch instead of one-by-one REST — avoids N+1.
- **Row-level error tracking** — Parse or batch-response failures stored in the `errors_json` field as `[{rowIndex, productId, message}]`. Sellers see exactly which products failed and why.
- **Circuit breaker** — When catalog is down, throws `CatalogUnavailableException` → job marked FAILED, no Feign pile-up.
- **Not idempotent** — Uploading the same file twice creates products twice. Sellers are expected to be careful; can be solved later with an external ID + upsert.
- **Category mapping** — Google Merchant `Apparel & Accessories > ...` chain reduced to a flat marketplace category id; unmatched items fall back to a default category.

### API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/feeds/import` | Multipart XML upload (seller-only) |
| `GET`  | `/api/v1/feeds/imports` | Seller's import history |
| `GET`  | `/api/v1/feeds/imports/{jobId}` | Single import detail (with errors) |

### Import Flow

1. Seller selects an XML file in frontend → `POST /api/v1/feeds/import`
2. ImportJob persisted as `PROCESSING`
3. `GoogleMerchantXmlParser` parses the file → `GoogleMerchantItem` list
4. Each item is validated via `mapToRequest()`; failed ones go to `rowErrors`
5. Valid ones forwarded as a single `catalogGateway.createBatch(sellerId, validRequests)` call
6. Failures in catalog response (existing SKU, etc.) appended as row-level errors
7. Job persisted as `COMPLETED`; seller receives summary + errors
