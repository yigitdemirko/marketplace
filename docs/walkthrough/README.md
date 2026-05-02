# Servis Walkthrough'ları / Service Walkthroughs

[← Ana README / Main README](../../README.md)

Her servis için 5 dakikalık anlatım notları. İki dilli: önce Türkçe, sonra İngilizce. Mülakat hazırlığı, code-review onboarding ve takım içi knowledge-sharing için.

5-minute talking notes per service. Bilingual: Turkish first, then English. For interview prep, code-review onboarding, and team knowledge-sharing.

## Servisler / Services

| Servis | Walkthrough |
|--------|-------------|
| api-gateway | [api-gateway.md](./api-gateway.md) |
| config-server | [config-server.md](./config-server.md) |
| discovery-server | [discovery-server.md](./discovery-server.md) |
| user-service | [user-service.md](./user-service.md) |
| catalog-service | [catalog-service.md](./catalog-service.md) |
| inventory-service | [inventory-service.md](./inventory-service.md) |
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
