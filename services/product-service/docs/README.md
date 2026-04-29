# Product Service

Manages product catalog with CRUD operations, inventory tracking, and Kafka event publishing.

## Responsibilities

- Product CRUD (create, read, update, delete)
- Category and seller based filtering
- Pagination support
- Publishing product events to Kafka for search indexing

## Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/products` | Create product | Seller |
| GET | `/api/v1/products` | List all products | Public |
| GET | `/api/v1/products/{id}` | Get product by ID | Public |
| GET | `/api/v1/products/category/{categoryId}` | Get by category | Public |
| GET | `/api/v1/products/seller/{sellerId}` | Get by seller | Public |
| PUT | `/api/v1/products/{id}` | Update product | Seller |
| DELETE | `/api/v1/products/{id}` | Soft delete product | Seller |

## Tech Stack

- Spring Boot 3.5
- MongoDB — product catalog
- Redis — caching
- Apache Kafka — event publishing

## Kafka Events

| Topic | Direction | Description |
|-------|-----------|-------------|
| `product.updated` | Publisher | Published on create/update/delete |
| `order.created` | Consumer | Reserves stock on new order |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MONGODB_HOST | MongoDB host | localhost |
| REDIS_HOST | Redis host | localhost |
| KAFKA_BOOTSTRAP_SERVERS | Kafka servers | localhost:9092 |
| EUREKA_HOST | Eureka server host | localhost |

## Running Locally

```bash
mvn spring-boot:run -pl services/product-service
```