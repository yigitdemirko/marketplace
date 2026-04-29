# Payment Service

Handles payment processing via Iyzico sandbox integration.

## Responsibilities

- Payment processing via Iyzico
- Idempotency key support
- Publishing payment events to Kafka

## Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/payments` | Process payment | Buyer |
| GET | `/api/v1/payments/order/{orderId}` | Get payment by order | Buyer |

## Tech Stack

- Spring Boot 3.5
- PostgreSQL + Flyway
- Apache Kafka — event publishing
- Iyzico — payment gateway

## Kafka Events

| Topic | Direction | Description |
|-------|-----------|-------------|
| `payment.completed` | Publisher | Published on successful payment |
| `payment.failed` | Publisher | Published on failed payment |

## Database

PostgreSQL — `payment_db`

Tables: `payments`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | PostgreSQL host | localhost |
| DB_USERNAME | PostgreSQL username | postgres |
| DB_PASSWORD | PostgreSQL password | postgres |
| KAFKA_BOOTSTRAP_SERVERS | Kafka servers | localhost:9092 |
| IYZICO_API_KEY | Iyzico API key | — |
| IYZICO_SECRET_KEY | Iyzico secret key | — |
| EUREKA_HOST | Eureka server host | localhost |

## Iyzico Test Cards

| Card Number | Description |
|-------------|-------------|
| 5528790000000008 | Successful payment |
| 5528790000000016 | Failed payment |

## Running Locally

```bash
mvn spring-boot:run -pl services/payment-service
```