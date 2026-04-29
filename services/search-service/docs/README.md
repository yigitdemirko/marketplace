# Search Service

Provides full-text product search powered by Elasticsearch, synced via Kafka events.

## Responsibilities

- Full-text product search
- Category and seller based filtering
- Indexing products from Kafka events

## Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/search` | Search products | Public |
| GET | `/api/v1/search?query={q}` | Search by query | Public |
| GET | `/api/v1/search/category/{categoryId}` | Search by category | Public |
| GET | `/api/v1/search/seller/{sellerId}` | Search by seller | Public |

## Tech Stack

- Spring Boot 3.5
- Elasticsearch 8.15
- Apache Kafka — event consumption

## Kafka Events

| Topic | Direction | Description |
|-------|-----------|-------------|
| `product.updated` | Consumer | Indexes product to Elasticsearch |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| ELASTICSEARCH_HOST | Elasticsearch host | localhost |
| KAFKA_BOOTSTRAP_SERVERS | Kafka servers | localhost:9092 |
| EUREKA_HOST | Eureka server host | localhost |

## Running Locally

```bash
mvn spring-boot:run -pl services/search-service
```