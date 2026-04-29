# Marketplace

A modern e-commerce platform built with microservices architecture.

![CI](https://github.com/yigitdemirko/marketplace/actions/workflows/ci.yaml/badge.svg)
![Deploy](https://github.com/yigitdemirko/marketplace/actions/workflows/deploy.yaml/badge.svg)
![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-green?logo=springboot)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)

## Overview

Marketplace is a full-stack e-commerce platform featuring buyer and seller workflows, real-time search, Kafka-based event-driven communication, and Iyzico payment integration.

## Architecture

```
                          ┌─────────────────┐
                          │   React Frontend │
                          │   (Port: 80)     │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │   API Gateway   │
                          │   (Port: 8080)  │
                          └────────┬────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                         │
┌─────────▼──────┐      ┌──────────▼──────┐      ┌─────────▼──────┐
│  User Service  │      │ Product Service │      │  Order Service │
│  (Port: 8081)  │      │  (Port: 8082)   │      │  (Port: 8084)  │
└────────────────┘      └────────┬────────┘      └───────┬────────┘
                                  │                        │
                         ┌────────▼────────┐    ┌─────────▼──────┐
                         │  Search Service │    │Payment Service │
                         │  (Port: 8083)   │    │  (Port: 8085)  │
                         └─────────────────┘    └────────────────┘
                                                          │
                                               ┌──────────▼──────┐
                                               │   Notification  │
                                               │   (Port: 8086)  │
                                               └─────────────────┘
```

## Services

| Service | Port | Description | Stack |
|---------|------|-------------|-------|
| api-gateway | 8080 | Routes requests to services | Spring Cloud Gateway |
| user-service | 8081 | Authentication, buyer/seller registration | Spring Boot, PostgreSQL, JWT |
| product-service | 8082 | Product CRUD, inventory | Spring Boot, MongoDB, Redis |
| search-service | 8083 | Full-text product search | Spring Boot, Elasticsearch |
| order-service | 8084 | Order management, Saga pattern | Spring Boot, PostgreSQL, Kafka |
| payment-service | 8085 | Payment processing | Spring Boot, PostgreSQL, Iyzico |
| notification-service | 8086 | Email notifications | Spring Boot, Kafka, JavaMail |
| config-server | 8888 | Centralized configuration | Spring Cloud Config |
| discovery-server | 8761 | Service discovery | Eureka |

## Tech Stack

### Backend
- **Java 21** + **Spring Boot 3.5**
- **Spring Cloud** (Gateway, Eureka, Config)
- **Apache Kafka** — event-driven communication
- **PostgreSQL** — relational data (users, orders, payments)
- **MongoDB** — product catalog
- **Redis** — caching
- **Elasticsearch** — product search
- **Iyzico** — payment processing
- **Flyway** — database migrations

### Frontend
- **React 18** + **TypeScript**
- **TanStack Router** + **TanStack Query**
- **Zustand** — state management
- **Tailwind CSS** + **shadcn/ui**
- **Vite** — build tool

### Infrastructure
- **Docker Compose** — local development
- **Nginx** — frontend serving
- **Hetzner Cloud** — production hosting
- **GitHub Actions** — CI/CD

## Kafka Event Flow

```
Order Created → order.created → Product Service (stock reservation)
                             → Notification Service (email)

Stock Reserved → stock.reserved → Order Service (status: PAYMENT_PENDING)
Stock Failed   → stock.reservation.failed → Order Service (status: CANCELLED)

Payment Completed → payment.completed → Order Service (status: CONFIRMED)
                                      → Notification Service (email)
Payment Failed    → payment.failed    → Order Service (status: CANCELLED)
                                      → Notification Service (email)

Product Updated → product.updated → Search Service (Elasticsearch index)
```

## Getting Started

### Prerequisites

- Java 21
- Maven 3.9+
- Docker + Docker Compose
- Node.js 20+ + pnpm

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/yigitdemirko/marketplace.git
cd marketplace
```

2. **Create environment file**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Build all services**
```bash
make build
```

4. **Start all services**
```bash
make up
```

5. **Start frontend**
```bash
cd frontend
pnpm install
pnpm dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- API Gateway: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- Eureka Dashboard: http://localhost:8761

### Environment Variables

Create a `.env` file in the root directory:

```env
IYZICO_API_KEY=your-sandbox-api-key
IYZICO_SECRET_KEY=your-sandbox-secret-key
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### Makefile Commands

```bash
make build          # Build all services
make up             # Start all services
make down           # Stop all services
make clean          # Stop services and remove volumes
make test           # Run all tests
```

## API Documentation

Swagger UI is available at: `http://localhost:8080/swagger-ui/index.html`

All services are accessible via the API Gateway at `http://localhost:8080`:

| Service | Base Path |
|---------|-----------|
| Auth | `/api/v1/auth` |
| Products | `/api/v1/products` |
| Search | `/api/v1/search` |
| Orders | `/api/v1/orders` |
| Payments | `/api/v1/payments` |

## Testing

```bash
# Run unit tests
mvn test -pl services/user-service,services/product-service,services/search-service,services/order-service,services/payment-service -Dgroups=unit

# Run integration tests
mvn test -pl services/user-service,services/product-service -Dgroups=integration
```

## CI/CD

- **CI** — Runs on PRs with `backend` or `frontend` label
    - Backend: unit tests + integration tests
    - Frontend: TypeScript check + production build
- **Deploy** — Runs on every push to `main`, deploys only changed services

## Project Structure

```
marketplace/
├── infrastructure/
│   ├── api-gateway/
│   ├── config-server/
│   ├── discovery-server/
│   └── postgres/
├── services/
│   ├── user-service/
│   ├── product-service/
│   ├── search-service/
│   ├── order-service/
│   ├── payment-service/
│   └── notification-service/
├── frontend/
├── docker-compose.yaml
├── Makefile
└── pom.xml
```

## License

MIT