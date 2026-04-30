ALTER TABLE outbox_events ADD COLUMN aggregate_id VARCHAR(36);
UPDATE outbox_events SET aggregate_id = id WHERE aggregate_id IS NULL;
ALTER TABLE outbox_events ALTER COLUMN aggregate_id SET NOT NULL;
