CREATE TABLE outbox_events
(
    id           VARCHAR(36)  PRIMARY KEY,
    event_type   VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(36)  NOT NULL,
    payload      TEXT         NOT NULL,
    processed    BOOLEAN      NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMP,
    created_at   TIMESTAMP
);

CREATE INDEX idx_payment_outbox_processed ON outbox_events (processed);
