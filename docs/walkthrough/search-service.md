# search-service — Walkthrough

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

Tam metin ürün araması. Catalog-service'in **read-only replica**'sı: hiçbir yazma endpoint'i yok. `product.updated` event'lerini consume eder, Elasticsearch indeksine yazar. Buyer arama deneyiminin (filtre, kategori, fiyat aralığı, sıralama) hızlı çalışmasını sağlar.

### Bağımlılıklar

- **Elasticsearch** — `products` indeksi
- **Kafka** — consumer (`product.updated`)

### Veri Modeli

```
products (Elasticsearch index)
  id, sellerId, name, description, price, stock, categoryId, brand,
  images[], attributes{}, active
```

### Önemli Dosyalar

| Dosya | Sorumluluk |
|-------|-----------|
| `application/service/SearchService.java` | Index, sorgula, filtrele |
| `application/service/ReindexService.java` | Manuel reindex (admin operasyonu) |
| `infrastructure/messaging/ProductEventConsumer.java` | `product.updated` → indeksi güncelle |
| `domain/repository/ProductSearchRepository.java` | Spring Data Elasticsearch repo |
| `domain/model/ProductDocument.java` | ES document mapping |
| `api/v1/controller/SearchController.java` | `/api/v1/search` endpoint'i |

### Önemli Patternler

- **CQRS okuma kaynağı** — Catalog "command + truth", search "query + indeks". Eventual consistency: ürün değişince ~ms içinde indeks güncellenir.
- **Tek consumer, tek topic** — `product.updated`. Catalog hem yeni ürünlerde hem stok değişiminde (StockChangedConsumer) bunu yayınladığı için search her durumda haberdar.
- **Inactive ürünleri filtrele** — Search query'leri `active=true` filter'ı ekler. Soft-delete'ten sonra (active=false) ürünler search sonuçlarında görünmez ama indeksten silinmez (audit/restore için).
- **Brand + categoryId facet** — Aggregations ile filtreleme; frontend'de kategori ve marka seçicileri besler.
- **Kafka DLT** — `product.updated.DLT` consumer hatasında 3 retry sonrası DLT'ye gider.

### API

| Method | Path | Açıklama |
|--------|------|----------|
| `GET`  | `/api/v1/search?q=...&category=...&minPrice=...&maxPrice=...&sort=...&page=...` | Ürün arama |
| `POST` | `/api/v1/search/reindex` | Tüm indeksi yeniden oluştur (admin) |

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

Full-text product search. A **read-only replica** of catalog-service: no write endpoints. Consumes `product.updated` events and indexes into Elasticsearch. Powers the buyer search experience (filters, categories, price ranges, sort) at low latency.

### Dependencies

- **Elasticsearch** — `products` index
- **Kafka** — consumer (`product.updated`)

### Data Model

```
products (Elasticsearch index)
  id, sellerId, name, description, price, stock, categoryId, brand,
  images[], attributes{}, active
```

### Key Files

| File | Responsibility |
|------|---------------|
| `application/service/SearchService.java` | Index, query, filter |
| `application/service/ReindexService.java` | Manual reindex (admin op) |
| `infrastructure/messaging/ProductEventConsumer.java` | `product.updated` → update index |
| `domain/repository/ProductSearchRepository.java` | Spring Data Elasticsearch repo |
| `domain/model/ProductDocument.java` | ES document mapping |
| `api/v1/controller/SearchController.java` | `/api/v1/search` endpoint |

### Key Patterns

- **CQRS read side** — Catalog is "command + truth", search is "query + index". Eventual consistency: product change → index update within ms.
- **Single consumer, single topic** — `product.updated`. Catalog publishes this both for new products and stock changes (StockChangedConsumer), so search is always notified.
- **Filter inactive products** — Search queries add `active=true` filter. After soft-delete (active=false), products disappear from search but stay in the index (for audit/restore).
- **Brand + categoryId facets** — Aggregations enable filtering; powers the frontend category and brand selectors.
- **Kafka DLT** — `product.updated.DLT` for consumer failures after 3 retries.

### API

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/v1/search?q=...&category=...&minPrice=...&maxPrice=...&sort=...&page=...` | Product search |
| `POST` | `/api/v1/search/reindex` | Rebuild full index (admin) |
