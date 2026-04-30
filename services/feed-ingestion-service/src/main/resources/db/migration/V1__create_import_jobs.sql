CREATE TABLE import_jobs (
    id UUID PRIMARY KEY,
    seller_id VARCHAR(255) NOT NULL,
    file_name VARCHAR(512) NOT NULL,
    total_items INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL,
    errors TEXT,
    created_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP
);

CREATE INDEX idx_import_jobs_seller_created ON import_jobs (seller_id, created_at DESC);
