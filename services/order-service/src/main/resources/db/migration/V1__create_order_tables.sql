CREATE TABLE orders
(
    id               VARCHAR(36) PRIMARY KEY,
    user_id          VARCHAR(36)    NOT NULL,
    status           VARCHAR(50)    NOT NULL,
    total_amount     DECIMAL(19, 2) NOT NULL,
    idempotency_key  VARCHAR(255)   NOT NULL UNIQUE,
    shipping_address TEXT,
    created_at       TIMESTAMP,
    updated_at       TIMESTAMP
);

CREATE TABLE order_items
(
    id         VARCHAR(36) PRIMARY KEY,
    order_id   VARCHAR(36)    NOT NULL,
    product_id VARCHAR(36)    NOT NULL,
    seller_id  VARCHAR(36)    NOT NULL,
    quantity   INTEGER        NOT NULL,
    unit_price DECIMAL(19, 2) NOT NULL,
    CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE TABLE outbox_events
(
    id           VARCHAR(36) PRIMARY KEY,
    event_type   VARCHAR(100) NOT NULL,
    payload      TEXT         NOT NULL,
    processed    BOOLEAN      NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMP,
    created_at   TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders (user_id);
CREATE INDEX idx_orders_idempotency_key ON orders (idempotency_key);
CREATE INDEX idx_outbox_processed ON outbox_events (processed);