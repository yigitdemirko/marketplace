CREATE TABLE payments
(
    id                VARCHAR(36) PRIMARY KEY,
    order_id          VARCHAR(36)    NOT NULL,
    user_id           VARCHAR(36)    NOT NULL,
    amount            DECIMAL(19, 2) NOT NULL,
    status            VARCHAR(50)    NOT NULL,
    idempotency_key   VARCHAR(255)   NOT NULL UNIQUE,
    iyzico_payment_id VARCHAR(255),
    failure_reason    TEXT,
    created_at        TIMESTAMP,
    updated_at        TIMESTAMP
);

CREATE INDEX idx_payments_order_id ON payments (order_id);
CREATE INDEX idx_payments_idempotency_key ON payments (idempotency_key);