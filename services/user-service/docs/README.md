# User Service

Handles user authentication and profile management for buyers and sellers.

## Responsibilities

- Buyer and seller registration
- JWT authentication
- User profile management

## Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/auth/buyer/register` | Register as buyer | Public |
| POST | `/api/v1/auth/seller/register` | Register as seller | Public |
| POST | `/api/v1/auth/login` | Login | Public |

## Tech Stack

- Spring Boot 3.5
- PostgreSQL + Flyway
- JWT (JJWT)
- Spring Security

## Database

PostgreSQL — `user_db`

Tables: `users`, `buyer_profiles`, `seller_profiles`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | PostgreSQL host | localhost |
| DB_USERNAME | PostgreSQL username | postgres |
| DB_PASSWORD | PostgreSQL password | postgres |
| EUREKA_HOST | Eureka server host | localhost |

## Running Locally

```bash
mvn spring-boot:run -pl services/user-service
```
