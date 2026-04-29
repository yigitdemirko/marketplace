# Order Service

Manages order lifecycle with Saga pattern for distributed transaction management.

## Responsibilities

- Order creation and management
- Saga orchestration (stock reservation → payment)
- Outbox pattern for reliable event publishing
- Idempotency key support

## Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/orders` | Create order | Buyer |
| GET | `/api/v1/orders` | List user orders | Buyer |
| GET | `/api/v1/orders/{orderId}` | Get order by ID | Buyer |
| DELETE | `/api/v1/orders/{orderId}` | Cancel order | Buyer |

## Tech Stack

- Spring Boot 3.5
- PostgreSQL + Flyway
- Apache Kafka — Saga events
- Redis

## Saga Flow

- PENDING → STOCK_RESERVING → PAYMENT_PENDING → CONFIRMED
- STOCK_RESERVING → CANCELLED (stock reservation failed)
- PAYMENT_PENDING → CANCELLED (payment failed)

## Kafka Events

| Topic | Direction | Description |
|-------|-----------|-------------|
| `order.created` | Publisher | Published on order creation |
| `order.cancelled` | Publisher | Published on order cancellation |
| `stock.reserved` | Consumer | Transitions to PAYMENT_PENDING |
| `stock.reservation.failed` | Consumer | Transitions to CANCELLED |
| `payment.completed` | Consumer | Transitions to CONFIRMED |
| `payment.failed` | Consumer | Transitions to CANCELLED |

## Database

PostgreSQL — `order_db`

Tables: `orders`, `order_items`, `outbox_events`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | PostgreSQL host | localhost |
| DB_USERNAME | PostgreSQL username | postgres |
| DB_PASSWORD | PostgreSQL password | postgres |
| REDIS_HOST | Redis host | localhost |
| KAFKA_BOOTSTRAP_SERVERS | Kafka servers | localhost:9092 |
| EUREKA_HOST | Eureka server host | localhost |

## Running Locally

```bash
mvn spring-boot:run -pl services/order-service
```