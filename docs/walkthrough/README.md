# Servis Walkthrough'ları / Service Walkthroughs

[← Ana README / Main README](../../README.md)

## Servisler / Services

| Servis | Walkthrough |
|--------|-------------|
| api-gateway | [api-gateway.md](./api-gateway.md) |
| config-server | [config-server.md](./config-server.md) |
| discovery-server | [discovery-server.md](./discovery-server.md) |
| user-service | [user-service.md](./user-service.md) |
| catalog-service | [catalog-service.md](./catalog-service.md) |
| inventory-service | [inventory-service.md](./inventory-service.md) |
| basket-service | [basket-service.md](./basket-service.md) |
| search-service | [search-service.md](./search-service.md) |
| order-service | [order-service.md](./order-service.md) |
| payment-service | [payment-service.md](./payment-service.md) |
| notification-service | [notification-service.md](./notification-service.md) |
| feed-ingestion-service | [feed-ingestion-service.md](./feed-ingestion-service.md) |

## Format

Her doküman aynı yapıyı izler:

1. **Sorumluluk / Responsibility** — servis ne yapar, ne yapmaz
2. **Bağımlılıklar / Dependencies** — datastore, dış servis, Kafka topic
3. **Veri Modeli / Data Model** — tablolar, koleksiyonlar
4. **Önemli Dosyalar / Key Files** — koda hızlı navigasyon
5. **Önemli Patternler / Key Patterns** — outbox, CB, idempotency, vb.
6. **API** — endpoint listesi
